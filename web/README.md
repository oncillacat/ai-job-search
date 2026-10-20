# AI Job Search: the app

A calm, chat-first job search for people applying to jobs in Canada. You talk to Claude: it reads your CV, searches
the job sites, tells you honestly which postings fit and why, and prepares a tailored CV and cover letter when you want
to apply. You review everything and submit it yourself.

It was built for people who find job hunting stressful, the fear of missing a posting and rewriting the same CV again
and again, so it aims to do the repetitive work quietly and show only what matters.

Built on the [ai-job-search](https://github.com/MadsLorentzen/ai-job-search) framework (MIT) by Mads Lorentzen. The
job-site clients in `lib/search/` are ported from that repo's command-line tools.

- **Mac app:** [download page](https://ai-job-search-phi.vercel.app/download) ·
  [release](https://github.com/oncillacat/ai-job-search/releases/tag/mac-app-v0.1.0)
- **Shared site:** https://ai-job-search-phi.vercel.app (Claude features need an access code)

## What it does

| | |
|---|---|
| **Reads your CV** | Upload a PDF; Claude extracts your profile (never inventing anything) and guesses the roles and cities to search, each with the reason from your CV. You confirm before anything runs. |
| **Searches job sites** | Job Bank Canada, LinkedIn, and Adzuna and Jooble when their keys are set. Duplicates and postings you've already seen are dropped. |
| **Rates the matches** | A keyword filter picks the 15 most relevant postings; Claude rates each high, medium or low, with a one-line reason and anything to check. |
| **Prepares applications** | For a real posting: reads the full description, checks fit honestly (score, strengths, gaps, hard blockers), and writes a tailored CV and cover letter in the posting's language. Unknowns are left as marked blanks. It never guesses application-form questions; paste real ones into the chat. |
| **Clean PDFs** | CV and cover letter download as real PDF files (no browser header or URL), with a clean text layer for applicant tracking systems. |
| **Dashboard** | Postings searched, matches by fit and source, applications grouped as Applied, Ready to send and Saved, and every prepared document. It starts empty and fills from your own activity. |
| **Follow-ups** | After two weeks without news, the chat asks whether you've heard back, with one-tap answers, and drafts a polite follow-up. |

## Three ways to run it

### 1. The Mac app (recommended)

Download the DMG from the [download page](https://ai-job-search-phi.vercel.app/download), drag it into Applications and
open it. The first time, enter your access code or your own Anthropic API key. The app runs on your Mac, opens in your
browser, and searches the job sites from your own internet connection, so LinkedIn works.

Apple Silicon (M1 or later), macOS 12 or newer. The app isn't signed with an Apple Developer ID, so the first launch
needs **System Settings → Privacy & Security → Open Anyway**.

### 2. The shared site

https://ai-job-search-phi.vercel.app. Anyone can read the landing, privacy and download pages. The chat and the other
app pages ask for an access code. On the shared site, searches use Job Bank (plus Adzuna and Jooble when configured);
LinkedIn refuses cloud servers, so the chat points to the Mac app for it.

### 3. From the code

```bash
cd web
npm install
npm run build
npx next start -p 3124 -H 127.0.0.1
```

Then open http://localhost:3124/chat. Or double-click `scripts/start.command`: it asks for an access code the first
time, builds when the code changed, starts the app on this computer only and opens the browser.

Give it Claude in one of three ways:

- your own key in `web/.env.local`: `ANTHROPIC_API_KEY=sk-ant-…`
- your own key, or an access code, saved from **Settings → Keys and access** (stored in the macOS Keychain)
- an access code in `web/.env.local`: `REMOTE_SITE=https://ai-job-search-phi.vercel.app` and `REMOTE_ACCESS_CODE=…`

Without any of these the chat runs as a scripted demo with fictional sample data.

## How it works

```
 Your browser ──► the app on your computer (127.0.0.1:3124)
                    │  searches Job Bank, LinkedIn, Adzuna, Jooble from your internet
                    │  reads full postings for tailoring
                    │
                    ├─ your own API key? ──► Claude API
                    └─ access code? ──────► shared site (Vercel) ──► Claude API
                                            holds the owner's key, checks the code
```

- **Claude** (`claude-opus-5-5`) runs in the server routes: `api/chat` (streaming, tool use), `api/profile` (CV
  reading), `api/search` (rating), `api/tailor` (applications). Everything posting-related it reads is treated as
  untrusted text.
- **Your data stays in your browser.** Chat history, decisions and profile are in local storage; your CV, the profile
  read from it and every generated document are in the browser's private file storage (Settings → Your files, where
  you can download or delete them). There's no database and no account yet.
- **Keys** on your Mac live in the Keychain (`lib/secrets.ts`); Settings shows only that a key is set and its last four
  characters. If a key or access code is rejected, the chat asks for a new one and retries.
- **A connected local app** sends Claude calls server to server to the shared site with the access code
  (`lib/remote.ts`). Browsers block websites from calling apps on your computer, which is why the search runs in the
  local app rather than from the shared site's page.

## Privacy and security

- The local app listens on 127.0.0.1 only, so others on the same network can't use it or your key.
- The keys endpoint answers only the app itself (same origin, `localhost` host header).
- The shared site's Claude features need the access code: a signed, HttpOnly cookie for browsers, or the
  `X-Access-Code` header for a connected local app. Wrong codes are slowed down.
- The Mac app is built from a clean copy of the code with no `.env` files, and the build stops if anything shaped like
  an API key ends up inside it.
- LinkedIn's terms don't allow automated access. Keep searches small and personal; it's off on the shared site's
  servers.

## Configuration

| Variable | Where | What |
|---|---|---|
| `ANTHROPIC_API_KEY` | local, Vercel | Claude key. On Vercel it's the owner's key behind the access code. |
| `APP_PASSCODE` | Vercel | The access code. Without it (and without `ALLOW_PUBLIC_CHAT`), the shared site stays a sample demo. |
| `ALLOW_PUBLIC_CHAT` | Vercel | Opens Claude to anyone with the link. Not recommended. |
| `REMOTE_SITE`, `REMOTE_ACCESS_CODE` | local | Use Claude through the shared site instead of your own key. |
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `JOOBLE_API_KEY` | both | Extra job sources (free keys). |
| `ENABLE_LINKEDIN` | both | `0` turns LinkedIn off locally; `1` tries it on Vercel (usually refused). |
| `LIVE_SEARCH` | both | `0` brings back the sample search rounds. |

## Deploying the shared site

```bash
cd web
npx vercel deploy --prod
```

Set `ANTHROPIC_API_KEY` and `APP_PASSCODE` in the Vercel project, and a monthly spend limit in the Anthropic console
before sharing the code.

## Building the Mac app

Download the official Node.js build for `darwin-arm64` from nodejs.org, unpack it, then:

```bash
cd web
scripts/build-mac-app.sh /path/to/node-v24.x.x-darwin-arm64
```

The DMG lands in `dist/`. Publish it as a GitHub release and update the link on `app/(marketing)/download/page.tsx`.

## Project layout

```
web/
  app/(marketing)/      landing, privacy, download, access-code pages
  app/(app)/            chat, dashboard, profile, settings
  app/api/              chat, profile, search, tailor, access; api/local/* for the local app only
  components/chat/      chat, cards, tailoring, PDF export
  lib/search/           job sites, full postings, search and rating
  lib/access.ts         access code; lib/remote.ts connected local app; lib/secrets.ts Keychain
  lib/state/            browser state, private file storage, keys
  scripts/              start.command, build-mac-app.sh, mac-launcher.sh, app icon
  docs/plan-chat-first.md   the product plan
```

## Not yet

- Real sign-in and per-person accounts (planned with Supabase), so data can follow you between devices.
- Intel Macs, Windows, and a signed, notarised Mac app.
- An automatic daily search.

## Licence

MIT, like the framework it's built on. Source Sans 3 (in `public/fonts`) is under the SIL Open Font License.
