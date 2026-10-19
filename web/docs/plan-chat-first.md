# Plan — Rebuild AI Job Search around a Claude chat (v4)

## Context
The site currently follows a page workflow (Today digest → job page → tailor → apply → job board) with a side "Ask" panel added later. The original product is a Claude Code CLI where everything happens in conversation (`/scrape`, `/apply`, `/interview`, follow-ups). The user wants the website to work the same way: **the first thing a signed-in user sees is a chat with Claude**, where they can start a job search, ask Claude to apply to a job, ask any question about a specific job, and run extra tasks such as a follow-up email for an application with no reply. **The dashboard becomes a supporting visual page** for what chat shows poorly (overviews, statuses, deadlines), not the main character.

App: `~/ai-job-search-web/web` (Next.js 16, Tailwind 4, `lib/data` sample data, `lib/state/demo-store.ts` browser state, `app/api/assistant/route.ts` Claude route), live at https://ai-job-search-phi.vercel.app. Calm principles, palette, square shapes, sans type, gradient and the demo banner stay.

### Decisions (from the user)
- **Real Claude only**: no scripted fallback. Without a key, the chat shows a clear "Claude isn't connected" state.
- **Real sign-in with Supabase** protects the key: only signed-in, invited users can chat.
- **Apply = prepare, the user submits**: Claude checks fit, tailors documents, answers form questions and opens the pre-filled form; the user presses Submit.
- **Dashboard is a separate page** (header link), chat is full width.
- **Landing page stays** as the front door ("Start chatting"); job, tailor, interview, profile pages stay as detail views opened from chat cards.
- Jobs remain **fictional sample data** for now (Claude's tools search and act on `lib/data`); real job sources are a later phase.

## Experience
- `/` landing → "Start chatting" → sign in (email magic link, invite list) → **`/chat`** (home for signed-in users).

### First run (decided in the Socratic session, 2026-10-18)
1. **Introduction / tutorial** shown once after first sign-in: how the intro, profile and job search work, and that **more information means better search results and better cover letters**. This is the only place Claude encourages uploading more.
2. The chat page, with a **"Let's go"** button.
3. **Profile setup happens inside the chat** with Claude, like the CLI's `/setup`:
   - **Required:** one CV.
   - **Optional, skippable:** transcript, graduation certificate, awards, LinkedIn profile, publications.
4. **Claude guesses the preferences a CV doesn't state** (target roles, cities, salary), following one rule: **guess → show the reason → confirm before acting → use only what the person uploaded.** Example: "I saw you're in [City] from your CV. Do you want me to search for jobs in [City]?" Strengths the uploads don't show stay unknown; Claude never invents them.
5. **One more setup question:** "If a job has a hard blocker (for example a citizenship requirement or a missing must-have skill), should I still prepare the application?" **Default: yes, go on** if they don't answer.
6. Claude runs the **first search**.

### Search replies
- **The first search reply contains:**
  - which portals were searched
  - how many jobs were searched
  - how many matched, split into high, medium and low
  - **the high matches, listed in the chat** with title, company, location, portal, date posted, fit and link
  - only the **errors that change today's results, in plain words** (e.g. "Adzuna was down today, so you may see fewer jobs than usual"). Duplicates skipped, retries and other routine choices stay hidden.
- **After the first search, the chat always shows a "Do a new search" button.** There is **no automatic daily search in the first version** (decided to keep scope small; revisit later).
- **Repeat searches show only jobs the person hasn't seen before** (like the CLI's `seen_jobs` dedup).
- **A day with no new strong matches:** Claude says so honestly, shows **up to 10 medium matches in the chat**, links to the dashboard for the rest, and states **how many jobs it searched** so a quiet day reads as a quiet market, not a failed tool.
- **Encouragement is grounded in the person's real numbers:** e.g. "You've reviewed 140 postings and applied to 4 this week. That's real effort." It appears **only when the person searches more than 2 times in a day or more than 3 times in a week**. No generic phrases.

### Applying
- "Apply to [job]" **runs every step in one go:** fit check → tailored CV and cover letter → answers to the form questions → open the pre-filled form. The person **reviews and edits the CV afterwards**, and always presses Submit themselves.
- **When a hard requirement is missing** after the evaluation, Claude **names the gap honestly** and does **not** ask for more uploads at that moment.
- **Hard blockers** (e.g. citizenship) follow the person's setup choice: by default Claude still prepares the application and adds a kind reminder about the blocker at the end.

### Follow-ups (decided 2026-10-19)
- **Trigger:** an application that has been **Applied for two weeks with no status change**. There is no email reading; statuses change only when the person updates them **by hand, in the chat or on the dashboard**.
- **Claude brings it up** and adds it to the dashboard's **to-do** list. It **asks first, with one-tap status buttons**: "Have you heard back from Cedar Point?" → *No reply yet* · *Interview* · *Offer* · *Rejected*.
  - *No reply yet* → Claude offers to draft a short follow-up email (Copy button; "Mark as followed up").
  - *Interview* / *Offer* → status updates; interview prep is offered.
  - **Rejected** → status updates and Claude offers **kind words only**: no new jobs, no advice. **This version uses one placeholder sentence, marked in the code as early and to be rewritten.**

### Dashboard (decided 2026-10-19)
Purpose: **where my applications stand**, and **the effort the product has made**. The chat stays the main character.

| Keep | Section | Serves |
|---|---|---|
| ✓ | Summary tiles | Product's effort |
| ✓ | New postings per day chart | Product's effort |
| ✓ | Breakdowns by match, source and status | Job status / effort |
| ✓ | Draft / Applied / Interview columns | Job status |
| ✓ | To-do (includes the two-week follow-up prompts) | Job status |
| ✓ | Ranked jobs with strengths and gaps | Evaluated jobs |
| ✓ | Today's postings table | Where the chat's "the rest are on the dashboard" link lands on quiet days |
| ✓ | Materials | Product's effort |
| ✗ | High-fit postings waiting | **Cut** |

### Still open
- What a returning user sees after a week away.
- Automatic daily search (deferred).
- Final wording for the rejection message (placeholder in this version).

### Chat basics
- Starter actions when the chat is idle: *Do a new search* · *Apply to a saved job* · *Ask about a job* · *Follow up on an application* · *Prepare for an interview*. Each reply ends with 2–3 short contextual suggestions.
- Claude replies with text plus **interactive cards** rendered from tool results:
  | Intent | Tool | Card |
  |---|---|---|
  | First run: CV + optional files | `read_uploads` → `propose_preferences` → `save_profile` | Upload card (CV required, others skippable) → "My guesses" card (each guess with its reason, Confirm / Change) → blocker-preference question |
  | "Do a new search" / "Find me jobs" | `search_jobs` (unseen jobs only) | Search summary (portals, searched count, high/medium/low, plain-words errors) + high-match job rows (title, company, location, portal, date posted, fit, link); quiet day: up to 10 medium matches + dashboard link; encouragement line when the search-count trigger is met |
  | Question about a job | `get_job` | Job card + answer |
  | "Apply to Maplewood" | `evaluate_job` → `tailor_documents` → `answer_form_questions` | Fit verdict → CV diff + Ready to send check → paste-ready answers → "Open the application" (pre-filled demo employer form) |
  | Two weeks Applied with no change (Claude raises it), or "No reply from Cedar Point" | `check_in_status` → `draft_follow_up` | "Have you heard back?" card with status buttons → email card with Copy + "Mark as followed up"; Rejected → placeholder kind-words message |
  | "Prep me for Riverbend" | `interview_prep` | Interview prep card |
  | "Show my applications" | `list_applications` | Mini pipeline + "Open dashboard" |
  | "Save / I applied / let it go" | `update_application` | Confirmation card |
- **Dashboard** (`/dashboard`, today's job board renamed, minus "High-fit postings waiting"; see the Dashboard table above). Statuses can be changed here by hand; reflects every chat action.
- Header for signed-in users: **Chat · Dashboard · Profile · Settings**.

## Architecture
- **Supabase** (`@supabase/ssr`): email magic-link auth with an `invites` allowlist; tables with RLS (each user sees only their rows):
  - `conversations`, `messages` (role, text, `card` JSONB) — chat history
  - `user_jobs` (save / applied / let-go / followed-up, dates) — replaces `decisions` in localStorage
  - `profiles` — the user's profile built from their uploads and confirmed guesses, plus `prepare_blocked_jobs` (default `true`) and `onboarded_at`
  - `uploads` — CV (required) and optional files in Supabase Storage (private bucket, `{user_id}/…`)
  - `seen_jobs` — every job shown to the user, so repeat searches return only new ones
  - `searches` — one row per search (time, searched count, tiers), used for the "more than 2 a day / more than 3 a week" encouragement trigger and the weekly numbers it quotes
  - `usage` — messages per user per day, for a daily cap
  - Migrations in `web/supabase/migrations/`; types via `supabase gen types`.
- **Chat route** `app/api/chat/route.ts` (replaces `api/assistant`): requires a Supabase session (401 otherwise), checks the daily cap, loads profile + history, calls `claude-opus-5-5` with **tool use** (the tools above, `strict: true`, run server-side against `lib/data` + Supabase), streams text and card events to the browser, saves messages. Keeps current safety rules (profile facts only, `[blanks]`, posting text untrusted, never submits) and refusal fallback.
- **Client**: `app/(app)/chat/page.tsx` + `components/chat/*` (message list, input, starters, card renderer). Cards reuse extracted pieces from digest, job page, `DocumentReview`, interview page, board (`components/cards/*`).
- Proxy (Next 16 `proxy.ts`) redirects signed-out users from app routes to sign-in.
- The old Ask side panel and `AskButton` are removed; "Ask about this job" buttons on detail pages open `/chat` with the job attached.
- **Cost guard (manual step for the user):** set a monthly spend limit in the Anthropic Console.

## Setup the user does (I'll guide; account creation is theirs)
1. Create a Supabase project (free tier); give me the project URL and anon key; put the service-role key and `ANTHROPIC_API_KEY` in Vercel env vars and `web/.env.local` themselves.
2. Add their own email to the invite list.

## Build steps
1. Supabase: schema + RLS migrations, auth (magic link, invite check), proxy, sign-in page.
2. Chat route with tools + streaming + persistence + daily cap.
3. Chat UI: one-time introduction/tutorial, "Let's go", upload card, guesses card, "Do a new search" button, starters, and card components (extracted from existing pages).
4. Move decisions/profile from localStorage to Supabase; dashboard reads from Supabase.
5. Navigation, landing CTA, rename board → dashboard; remove Ask panel.
6. Local end-to-end test, then deploy to Vercel with env vars.

## Verification
- `npm run build` + `npm run lint` clean; `supabase db reset` applies migrations; RLS check: user A can't read user B's rows.
- Signed out: `/chat` redirects; `POST /api/chat` returns 401.
- First run: introduction appears once; "Let's go" → upload CV only (skip extras) → guesses each show a reason and wait for confirmation → blocker question defaults to "go on" → first search reply has portals, counts, tiers, high-match rows with links.
- Second "Do a new search" shows no previously seen jobs; a run with zero high matches shows ≤10 medium + dashboard link + searched count; a 3rd search in one day adds the numbers-based encouragement line.
- Follow-ups: an application set to Applied 15 days ago appears in the dashboard to-do and Claude asks "Have you heard back?" with status buttons; *Rejected* shows only the placeholder kind words; *No reply yet* drafts an email.
- Dashboard: no "High-fit postings waiting" section; statuses editable; the chat's quiet-day link lands on Today's postings.
- Signed in, local with key: walkthrough "Find new jobs" → save → "apply to it" → ready check → open demo form → submit → dashboard shows Applied; "follow up on Cedar Point" → email card; question about a job → answer; daily cap message appears after the limit.
- Browser check desktop + 375px, light + dark.
- Personal-data scan of `app components lib` stays empty.
