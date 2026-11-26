# KoreanEasy 2.0 — Team Oreo

A redesigned AI companion for international students in South Korea.

## Features
- Gemini-powered Korean notice explanation
- 12 output language choices (English, Uzbek, Vietnamese, Chinese, Mongolian, Nepali, Thai, Russian, Japanese, Indonesian, Khmer, Filipino)
- Important action extraction: deadline, date/time, location, task, submission details
- Interactive 3-option/4-option quiz flow with score
- Save vocabulary locally
- Image OCR in the browser using Tesseract.js (`kor+eng`)
- Browser speech input where supported, and Korean pronunciation playback
- Local reminders, notification center, analysis history and JSON data export
- Light, dark and auto appearance; live local clock
- Responsive desktop and mobile layout

## Run locally
1. Install Node.js 20 or newer.
2. In the project folder run `npm install` (no additional package is required by this starter).
3. Add `GEMINI_API_KEY` to your local environment. Do not put the key in frontend code.
4. Run with Vercel CLI: `npx vercel dev`.

## Deploy to Vercel
1. Push this folder to a GitHub repository.
2. Import the repository into Vercel.
3. In Vercel → Project Settings → Environment Variables, add:
   - `GEMINI_API_KEY` = your Google Gemini API key
   - `GEMINI_MODEL` = `gemini-2.0-flash` (or a model available to your API key)
4. Redeploy after adding variables.
5. Open the deployment and test `/api/explain` via the interface.

## Important limitations (be honest in your presentation)
- A normal website cannot silently read all phone SMS or Android notifications. This version lets users paste/share text into KoreanEasy; direct SMS/notification access needs a separate Android app or an explicit OS-approved integration and user permissions.
- Voice input uses the browser Web Speech API. Support varies by browser and may require HTTPS and microphone permission. The current microphone flow recognizes Korean speech and analyzes the transcript as a Korean notice/question; it is not a universal always-listening assistant.
- OCR uses Tesseract.js loaded from a CDN and downloads Korean language data on first use. Clear, high-resolution images work best; always review dates/numbers manually.
- Vocabulary, history, reminders and notifications use browser localStorage. They are not synced across devices and can be cleared with browser data.
- The selected interface language currently translates the main navigation labels for English, Uzbek, Russian and Vietnamese; other language options are available for AI output and can be expanded to full interface localization. Do not claim every screen is fully translated into all 12 languages yet.
- This is a frontend/serverless prototype. It does not include user accounts, cloud database, push notifications, automatic deadline alarms or Android SMS permissions.

## Security
- Never commit `.env`, API keys or credentials to GitHub.
- Set the key only in Vercel Environment Variables.
- Do not paste passwords, passport numbers or other sensitive personal data into the AI assistant.
