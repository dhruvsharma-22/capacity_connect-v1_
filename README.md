# Capacity Connect

An SIH 2026 prototype for meteorology learning and workforce development. It runs as a self-contained mock portal with local sign-in, course and teacher pages, course progress, a learning assistant, quizzes, skills, and insights.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev` and open the local URL printed by Next.js.

No API keys, Supabase project, or real account is needed to use the mock portal. Create a demo account or use the prefilled email and password on the sign-in screen. Mock session and learner data stay in the current browser.

## Optional AI API integration

- `POST /api/ai/chat` accepts a question, optional course notes, and recent conversation turns. With Supabase configured, it embeds the question, retrieves similar course chunks from pgvector, and instructs the model to cite retrieved sources.
- `POST /api/ai/ingest` extracts text from a PDF. If a course ID and Supabase are supplied, it stores the PDF in a private Storage bucket and indexes chunks in pgvector. The mock dashboard omits a course ID, so its upload is extraction only.
- `POST /api/ai/generate-quiz` accepts course text, a difficulty, and a count, then returns validated multiple-choice questions with answer explanations. Drafts and learning progress are saved in this browser's local storage.
- `POST /api/ai/recommendations` ranks the included trainer demo profiles against skill goals. Without an OpenAI key it uses a simple skills overlap score.
- `POST /api/ai/course-recommendations` ranks available courses against learner skill gaps.
- `POST /api/ai/analyze-performance` summarizes assessment results and suggests practice. Without an OpenAI key it returns a basic score-based report.
- `OPENAI_MODEL` is configurable in `.env.local`; it defaults to `gpt-6.2-astra`.

The dashboard includes a sample meteorology excerpt. Upload a text-based PDF to extract local reference notes. Scanned PDFs need OCR and are not supported. The portal's assistant, question set, teacher matching, course recommendations, and performance feedback use deterministic or fixed mock data; they do not call an AI provider. The API routes below remain available as optional integration examples.

## Demo data and interactions

The app has mock sign-in and account creation, then routes to an overview, course catalog and course detail pages, instructor directory and profiles, learning progress, assistant, skill map, quiz studio, insights, and profile settings. Sign in with the prefilled demo account, or use any email and a password with at least six characters. Sign-out clears the local mock session.

The workspace is prefilled with five sample meteorology courses, five instructor profiles, learner skill scores, weekly study activity, assessment history, notifications, and a sample learning schedule. Course search and topic filters work. Course progress, quiz attempts, profile edits, chat history, and quiz drafts use this browser's local storage and are not shared between users.

The quiz studio includes five sample questions grounded in the bundled monsoon excerpt. The schedule, notifications, learner profile, assessment, course catalog, teacher profiles, and matches are illustrative mock data, not live IMD Academy records.

## Remaining integration work

This is a local demonstration build. Add Supabase authentication, role-aware policies, real course/trainer profiles, persistent chat/assessment records, API rate limits, and authorization on admin/ingest actions before deploying it for multiple users. Never expose the Supabase service-role key in client code or commit `.env.local`.
# Coteach
