This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Gemini API key (optional)

If you have a Google Gemini (Generative Language) API key you can put it in a `.env.local` file at the project root. Create the file (it is gitignored by Next.js by default) and add:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Restart the dev server after adding the key. When present, the assignments API will call Gemini to get a student-specific time estimate. If the key is not present or Gemini fails, the API falls back to a small local heuristic.

## Assignments API

The project exposes a server API under `/api/assignments` (Next.js route located at `src/app/api/assignments/route.js`).

- POST /api/assignments
  - Body: JSON { title, dueDate, description, userData }
  - Response: plain text containing only the estimated minutes (e.g. "45")

Example (curl):

```bash
curl -X POST http://localhost:3000/api/assignments -H "Content-Type: application/json" -d '{"title":"Write lab report","description":"Complete the chemistry lab report about titration.","userData":"student: first-year beginner, reads slowly"}'
```

The response will be a plain text integer (minutes) and no other text.

## UI helper

A small `SuggestButton` React component was added at `src/components/SuggestButton.jsx`. It renders a black button with white text suitable for the "Suggest" action in the UI.
