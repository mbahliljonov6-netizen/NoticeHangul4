// Vercel serverless endpoint. Keep GEMINI_API_KEY in Vercel Environment Variables.
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({
      error: "Server is missing GEMINI_API_KEY. Add it in Vercel Environment Variables.",
    });
  }

  const body = req.body || {};
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const mode = body.mode === "chat" ? "chat" : "explain";

  if (!text) {
    return res.status(400).json({ error: "Please enter Korean text first." });
  }
  if (text.length > 5000) {
    return res.status(400).json({ error: "Text is too long. Maximum is 5,000 characters." });
  }

  const allowed = [
    "English", "Uzbek", "Vietnamese", "Chinese", "Mongolian", "Nepali",
    "Thai", "Russian", "Japanese", "Indonesian", "Khmer", "Filipino",
  ];
  const outputLanguage = allowed.includes(body.lang) ? body.lang : "English";

  if (!/[가-힯]/.test(text)) {
    return res.status(400).json({
      error: "Please provide Korean text. KoreanEasy currently analyzes Korean-language notices and messages.",
    });
  }

  const prompt =
    mode === "chat"
      ? `You are KoreanEasy, a helpful assistant for international students living in South Korea. Answer in ${outputLanguage}. Be practical, friendly, and concise. If university or government policy may have changed, note that verification is needed instead of guessing.
User text: """${text}"""
Return ONLY valid JSON:
{"answer":"answer in ${outputLanguage}","suggested_actions":["action 1","action 2"]}`
      : `You are KoreanEasy, an accurate Korean notice explainer for international students in South Korea.
Analyze the Korean source text without inventing details. Use "" for any missing field (deadline, date_time, location, task, submission). Keep dates and numbers exact.
Return ONLY valid JSON with this exact structure:
{
  "summary": "2-4 clear beginner-friendly sentences in ${outputLanguage}",
  "actions": {
    "deadline": "",
    "date_time": "",
    "location": "",
    "task": "",
    "submission": ""
  },
  "words": [
    {"ko": "Korean word/phrase", "meaning": "meaning in ${outputLanguage}", "note": "short context hint"}
  ],
  "quiz": [
    {
      "question": "question in ${outputLanguage}",
      "options": ["option A", "option B", "option C", "option D"],
      "answer": "exact match from options",
      "explanation": "short explanation in ${outputLanguage}"
    }
  ]
}
Rules: include up to 5 vocabulary items and up to 3 quiz questions. Keep Korean terms in Korean, and explanations/questions in ${outputLanguage}.
Source text:
"""${text}"""`;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  async function callGemini() {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const err = new Error(`Gemini HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON in Gemini response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (mode === "chat") {
      if (typeof parsed.answer !== "string" || !parsed.answer.trim()) {
        throw new Error("Invalid chat response");
      }
      return {
        answer: parsed.answer.trim(),
        suggested_actions: Array.isArray(parsed.suggested_actions)
          ? parsed.suggested_actions.slice(0, 3)
          : [],
      };
    }

    if (!parsed.summary || !Array.isArray(parsed.words) || !Array.isArray(parsed.quiz) || !parsed.actions) {
      throw new Error("Incomplete explain response");
    }

    return {
      summary: parsed.summary,
      actions: {
        deadline: parsed.actions.deadline || "",
        date_time: parsed.actions.date_time || "",
        location: parsed.actions.location || "",
        task: parsed.actions.task || "",
        submission: parsed.actions.submission || "",
      },
      words: parsed.words.slice(0, 5),
      quiz: parsed.quiz.slice(0, 3).map((q) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
      })),
    };
  }

  try {
    const result = await callGemini();
    return res.status(200).json(result);
  } catch (err) {
    // 1 marta tezkor qayta urinish (vaqtinchalik tarmoq/limit xatosi bo'lsa)
    if (err?.status === 429 || err?.status >= 500 || err?.name === "TimeoutError") {
      try {
        await new Promise((r) => setTimeout(r, 400));
        const retryResult = await callGemini();
        return res.status(200).json(retryResult);
      } catch (retryErr) {
        return res.status(502).json({ error: "AI service is busy right now. Please try again in a moment." });
      }
    }
    return res.status(500).json({ error: "Failed to analyze Korean text." });
  }
};
