# AI Job Search: web preview

A calm job-search website built on the [ai-job-search](https://github.com/MadsLorentzen/ai-job-search) framework (MIT).
This is a **preview**: every screen works, using fictional sample data. There's no login and no database. The only
server code is the assistant route, which calls Claude when a key is set.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Connect the assistant to Claude

The **Ask** panel calls Claude through one server route (`app/api/assistant/route.ts`). Without a key it falls back to
preview drafts and says so.

1. Create `web/.env.local` (git-ignored) containing `ANTHROPIC_API_KEY=your-key`.
2. Restart `npm run dev`.

The route keeps no data. It forwards the conversation, the profile and the attached jobs to `claude-opus-5-5`, streams
the answer back, and has server-side refusal fallback turned on. Anyone who can reach the server can use your key, so
add sign-in and rate limits before deploying it publicly.

## Screens

| Route | What it is |
|---|---|
| `/` | Landing page |
| `/start` | CV upload (simulated reading) |
| `/digest` | Daily 9:00 a.m. digest: strong matches only, plus where postings came from and how many medium and low matches were set aside |
| `/jobs/[id]` | Verdict (Go / Maybe / Let it go), eligibility and language checks, match strength, keyword coverage, decision |
| `/jobs/[id]/tailor` | Master-vs-tailored CV diff, cover letter, Ready to send check |
| `/jobs/[id]/interview` | Calm interview prep |
| `/applications` | Saved / Applied / Interviewing / Closed |
| `/profile` | Master profile editor |
| `/settings` | Weekly rhythm, gentle extras, what the app has learned, clear data |

## Where data comes from

- `lib/data/index.ts` is the **only** module screens read from. It returns `lib/data/mock.ts` today; later each
  function becomes a Supabase query with the same signature.
- `lib/state/demo-store.ts` holds the visitor's choices (saved/skipped jobs, profile edits, settings) in
  `localStorage`. These become Server Actions when the backend arrives.
