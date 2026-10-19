"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { demoActions, getDemoState, useDemoState, type ChatCard, type ChatItem } from "@/lib/state/demo-store";
import {
  AnswerCard,
  ApplyCard,
  BlockerCard,
  btnPrimary,
  btnQuiet,
  CheckInCard,
  FollowUpEmailCard,
  GuessesCard,
  InterviewCard,
  IntroCard,
  KindCard,
  PickerCard,
  SearchCard,
  UploadCard,
} from "./chat-cards";
import { deleteAllFiles, saveFile } from "@/lib/state/local-files";
import type { ChatData } from "./chat-types";
import { RichText } from "./rich-text";
import type { ChatEvent } from "@/app/api/chat/route";
import type { ExtractedProfile } from "@/app/api/profile/route";
import type { LiveSearch } from "@/lib/search/types";

// Scripted demo of the chat-first design (docs/plan-chat-first.md). Real Claude replaces the
// routing in `route()` once sign-in exists; the cards stay the same.

type Status = "saved" | "applied" | "let-go" | "interview" | "offer" | "rejected" | null;

const starters = [
  "Do a new search",
  "Apply to a saved job",
  "Ask about a job",
  "Follow up on an application",
  "Prepare for an interview",
] as const;

export function ChatDemo({ data }: { data: ChatData }) {
  const { chat, decisions } = useDemoState();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);
  const params = useSearchParams();
  // Live Claude when the server has a key; otherwise the scripted routing below.
  const [live, setLive] = useState<{ on: boolean; reason?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat")
      .then((r) => r.json() as Promise<{ live: boolean; reason?: string }>)
      .then((d) => !cancelled && setLive({ on: d.live, reason: d.reason }))
      .catch(() => !cancelled && setLive({ on: false, reason: "Couldn't reach the server." }));
    return () => {
      cancelled = true;
    };
  }, []);

  const onboarded = chat.items.some((i) => i.card?.type === "blocker" && i.card.done);

  function statusOf(jobId: string): Status {
    const s = getDemoState();
    const d = s.decisions[jobId];
    if (d) return d.decision;
    // The sample applications belong to the sample person, not to someone who uploaded their own CV.
    if (s.chat.ownCv) return null;
    const app = data.applications.find((a) => a.jobId === jobId);
    if (!app) return null;
    return app.status === "closed" ? "rejected" : app.status;
  }

  const company = (jobId: string) => data.jobs.find((j) => j.id === jobId)?.company ?? "this job";
  const say = (text: string) => demoActions.chatAdd({ from: "claude", text });
  const you = (text: string) => demoActions.chatAdd({ from: "you", text });
  const card = (c: ChatCard, text?: string) => demoActions.chatAdd({ from: "claude", card: c, text });

  function dueCheckIns() {
    const s = getDemoState();
    return data.jobs
      .map((j) => j.id)
      .filter(
        (id) =>
          statusOf(id) === "applied" &&
          (daysSince(id) ?? 0) >= 14 &&
          !s.decisions[id]?.followedUpAt &&
          !s.chat.checkedIn.includes(id),
      );
  }

  /** Days since the person applied: from their own decision, or the sample data for the sample person. */
  function daysSince(jobId: string): number | undefined {
    const s = getDemoState();
    const d = s.decisions[jobId];
    if (d?.decision === "applied") return Math.floor((Date.now() - Date.parse(d.at)) / 864e5);
    return s.chat.ownCv ? undefined : data.daysSinceApplied[jobId];
  }

  function raiseCheckIns() {
    const due = dueCheckIns();
    if (!due.length) return;
    demoActions.chatSet({ checkedIn: [...getDemoState().chat.checkedIn, ...due] });
    due.forEach((id) => card({ type: "checkIn", jobId: id }));
  }

  // ---------- actions ----------

  /** Postings looked through and applications sent in the last 7 days. */
  function weekNumbers() {
    const s = getDemoState();
    const now = Date.now();
    const recent = s.chat.searches.filter((t) => now - Date.parse(t) < 7 * 864e5).length;
    const liveCards = s.chat.items.flatMap((i) => (i.card?.type === "search" && i.card.live ? [i.card.live] : []));
    const searched = liveCards.length
      ? liveCards.filter((l) => now - Date.parse(l.at) < 7 * 864e5).reduce((n, l) => n + l.searched, 0)
      : data.rounds
          .slice(0, Math.min(recent, data.rounds.length))
          .reduce((n, r) => n + r.sources.reduce((m, src) => m + src.count, 0), 0);
    const applied = data.jobs.filter((j) => {
      const st = statusOf(j.id);
      if (!st || st === "saved" || st === "let-go") return false;
      const d = s.decisions[j.id];
      return d ? now - Date.parse(d.at) < 7 * 864e5 : (data.daysSinceApplied[j.id] ?? 99) <= 7;
    }).length;
    return { searched, applied };
  }

  function runSearch(echo = true, byClaude = false, live?: LiveSearch) {
    const s = getDemoState();
    const now = new Date();
    const round = s.chat.searches.length;
    const searches = [...s.chat.searches, now.toISOString()];
    const sameDay = searches.filter((t) => new Date(t).toDateString() === now.toDateString()).length;
    const thisWeek = searches.filter((t) => now.getTime() - new Date(t).getTime() < 7 * 864e5).length;
    let encourage: { searched: number; applied: number } | undefined;
    if (!byClaude && (sameDay > 2 || thisWeek > 3)) {
      const searched = data.rounds
        .slice(0, Math.min(round + 1, data.rounds.length))
        .reduce((n, r) => n + r.sources.reduce((m, src) => m + src.count, 0), 0);
      const applied = data.jobs.filter((j) => {
        const st = statusOf(j.id);
        if (!st || st === "saved" || st === "let-go") return false;
        const d = s.decisions[j.id];
        return d ? now.getTime() - new Date(d.at).getTime() < 7 * 864e5 : (data.daysSinceApplied[j.id] ?? 99) <= 7;
      }).length;
      encourage = { searched, applied };
    }
    demoActions.chatSet({
      searches,
      focusJob: null,
      seenJobs: live ? [...s.chat.seenJobs, ...live.seenIds].slice(-3000) : s.chat.seenJobs,
    });
    if (echo) you("Do a new search");
    card({ type: "search", round, encourage, byClaude, live });
    // Check-ins are about the sample applications, so they belong with the sample search only.
    if (round === 0 && !live) raiseCheckIns();
  }

  function startApply(jobId: string) {
    you(`Apply to ${company(jobId)}`);
    demoActions.chatSet({ focusJob: jobId });
    card({ type: "apply", jobId });
  }

  function startAsk(jobId: string) {
    demoActions.chatSet({ focusJob: jobId });
    say(`Sure. What would you like to know about ${data.jobs.find((j) => j.id === jobId)?.title} at ${company(jobId)}? You can paste a question from an online interview or the application form, or ask anything.`);
  }

  function startInterview(jobId: string) {
    you(`Prepare me for the ${company(jobId)} interview`);
    card({ type: "interview", jobId });
  }

  function startFollowUp(jobId: string) {
    you(`Follow up on ${company(jobId)}`);
    card({ type: "checkIn", jobId });
  }

  const pickerJobs: Record<Extract<ChatCard, { type: "picker" }>["purpose"], () => string[]> = {
    apply: () => data.jobs.filter((j) => data.tailored[j.id] && statusOf(j.id) !== "applied").map((j) => j.id),
    ask: () => data.jobs.map((j) => j.id),
    interview: () => data.jobs.map((j) => j.id).sort((a) => (statusOf(a) === "interview" ? -1 : 1)),
    followup: () => data.jobs.filter((j) => statusOf(j.id) === "applied").map((j) => j.id),
  };

  function starter(label: (typeof starters)[number]) {
    if (busy) return;
    // With Claude connected, a starter button is the same as typing its words.
    if (live?.on) return void askClaude(label);
    if (label === "Do a new search") return runSearch();
    you(label);
    const purpose = (
      { "Apply to a saved job": "apply", "Ask about a job": "ask", "Follow up on an application": "followup", "Prepare for an interview": "interview" } as const
    )[label];
    card({ type: "picker", purpose });
  }

  function pick(itemId: string, purpose: Extract<ChatCard, { type: "picker" }>["purpose"], jobId: string) {
    demoActions.chatUpdateCard(itemId, { done: `${data.jobs.find((j) => j.id === jobId)?.title} · ${company(jobId)}` });
    if (purpose === "apply") card({ type: "apply", jobId });
    if (purpose === "ask") startAsk(jobId);
    if (purpose === "interview") card({ type: "interview", jobId });
    if (purpose === "followup") card({ type: "checkIn", jobId });
  }

  function checkInAnswer(itemId: string, jobId: string, status: "none" | "interview" | "offer" | "rejected", label: string) {
    demoActions.chatUpdateCard(itemId, { done: label });
    you(label);
    if (status === "none") card({ type: "followUpEmail", jobId });
    if (status === "interview") {
      demoActions.decide(jobId, "interview");
      say(`That's great news. I've moved ${company(jobId)} to Interview on your dashboard. Here's some calm prep:`);
      card({ type: "interview", jobId });
    }
    if (status === "offer") {
      demoActions.decide(jobId, "offer");
      say(`Congratulations. I've marked ${company(jobId)} as an offer. Take your time deciding; if you'd like, ask me anything about it.`);
    }
    if (status === "rejected") {
      demoActions.decide(jobId, "rejected");
      card({ type: "kind", jobId });
    }
  }

  // ---------- live Claude ----------

  function describe(item: ChatItem): string {
    const c = item.card;
    const parts = item.text ? [item.text] : [];
    if (!c) return parts.join("");
    const job = "jobId" in c ? ` (${company(c.jobId)}, ${c.jobId})` : "";
    const note: Record<ChatCard["type"], string> = {
      intro: "[Showed the welcome]",
      upload: "[Profile set up from the person's CV]",
      guesses:
        c.type === "guesses"
          ? `[Preferences confirmed: roles ${c.roles ?? "?"}; where ${c.cities ?? "?"}; salary ${c.salary || "not set"}]`
          : "",
      blocker: "[Blocker preference answered]",
      search:
        c.type === "search"
          ? c.live
            ? `[Showed live search results: ${c.live.searched} new postings; ${[...c.live.high, ...c.live.medium.slice(0, 10)]
                .map((x) => `${x.title} at ${x.company}, ${x.location} (${x.portal}, ${x.fit} ${x.score}, ${x.url})`)
                .join("; ") || "no strong or medium matches"}]`
            : `[Showed search results, run ${c.round + 1}]`
          : "",
      picker: c.type === "picker" ? `[Asked which job, for: ${c.purpose}]` : "",
      apply: c.type === "apply" ? `[Showed the application package${job}${c.submitted ? "; marked submitted" : ""}]` : "",
      answer: `[Answered a question${job}]`,
      checkIn: c.type === "checkIn" ? `[Asked if they heard back${job}${c.done ? `: ${c.done}` : ""}]` : "",
      followUpEmail: `[Showed a follow-up email draft${job}]`,
      kind: "[Offered kind words after a rejection]",
      interview: `[Showed interview prep${job}]`,
      note: "",
    };
    parts.push(note[c.type]);
    return parts.filter(Boolean).join("\n");
  }

  function transcript(nextUserText: string) {
    const msgs: { role: "user" | "assistant"; content: string }[] = [];
    for (const it of getDemoState().chat.items) {
      const role = it.from === "you" ? "user" : "assistant";
      const content = describe(it);
      if (!content) continue;
      const last = msgs[msgs.length - 1];
      if (last && last.role === role) last.content += `\n${content}`;
      else msgs.push({ role, content });
    }
    const last = msgs[msgs.length - 1];
    if (last && last.role === "user") last.content += `\n${nextUserText}`;
    else msgs.push({ role: "user", content: nextUserText });
    while (msgs.length && msgs[0].role !== "user") msgs.shift();
    return msgs.slice(-40);
  }

  /** The roles and cities the person confirmed on the guesses card, if any. */
  function confirmedPrefs() {
    const g = [...getDemoState().chat.items].reverse().find((i) => i.card?.type === "guesses" && i.card.done)?.card;
    const split = (v?: string) =>
      (v ?? "")
        .split(/,|;|\/|\bor\b|\band\b/)
        .map((x) => x.trim())
        .filter(Boolean)
        // "Toronto, ON": keep a province code or name with the city before it.
        .reduce<string[]>((out, x) => {
          if (out.length && /^([A-Z]{2}|Ontario|Quebec|Québec|British Columbia|Alberta|Manitoba|Nova Scotia|Saskatchewan|Canada)$/.test(x))
            out[out.length - 1] += `, ${x}`;
          else out.push(x);
          return out;
        }, []);
    return g?.type === "guesses" ? { roles: split(g.roles), cities: split(g.cities) } : undefined;
  }

  /** Sends a message to Claude. `show: false` sends it without adding a chat bubble (e.g. the first search). */
  async function askClaude(q: string, show = true) {
    const s = getDemoState();
    const messages = transcript(q);
    if (show) you(q);
    setBusy(true);
    const statuses = Object.fromEntries(data.jobs.map((j) => [j.id, statusOf(j.id)]));
    let current: string | null = null;
    let progress: string | null = null;
    let text = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          profile: s.profile ?? data.profile,
          state: {
            statuses,
            daysSinceApplied: Object.fromEntries(
              data.jobs.flatMap((j) => (daysSince(j.id) === undefined ? [] : [[j.id, daysSince(j.id)!]])),
            ),
            searchesDone: s.chat.searches.length,
            searchTimes: s.chat.searches,
            weekSearched: weekNumbers().searched,
            weekApplied: weekNumbers().applied,
            blockerPref: s.chat.blockerPref,
            focusJob: s.chat.focusJob,
            seen: s.chat.seenJobs,
            prefs: confirmedPrefs(),
          },
        }),
      });
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        say(err?.message ?? "Something went wrong. Try again.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line) as ChatEvent;
          if (e.t === "text") {
            text += e.v;
            if (!current) current = demoActions.chatAdd({ from: "claude", text })[0];
            else demoActions.chatSetText(current, text);
          } else if (e.t === "progress") {
            current = null;
            text = "";
            progress = demoActions.chatAdd({ from: "claude", text: e.v })[0];
          } else if (e.t === "tool") {
            current = null;
            text = "";
            if (progress) demoActions.chatRemove(progress);
            progress = null;
            handleTool(e);
          } else if (e.t === "error") {
            say(e.v);
          }
        }
      }
    } catch {
      say("Couldn't reach Claude. Check that the site is running and try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleTool(e: Extract<ChatEvent, { t: "tool" }>) {
    const id = e.jobId;
    if (id) demoActions.chatSet({ focusJob: id });
    switch (e.name) {
      case "search_jobs":
        return runSearch(false, true, e.search);
      case "prepare_application":
        return id && card({ type: "apply", jobId: id });
      case "check_in":
        return id && card({ type: "checkIn", jobId: id });
      case "draft_follow_up":
        return id && card({ type: "followUpEmail", jobId: id });
      case "interview_prep":
        return id && card({ type: "interview", jobId: id });
      case "update_status":
        if (id && e.status) demoActions.decide(id, e.status);
        return;
    }
  }

  /** Sends the uploaded CV to Claude, saves the profile it reads, and shows guesses from the CV. */
  async function readCv(uploadItemId: string, file: File) {
    const reopen = (message: string) => {
      say(`${message} You can upload another PDF or use the sample CV.`);
      demoActions.chatUpdateCard(uploadItemId, { done: false });
    };
    if (file.type !== "application/pdf") return reopen("I can read PDFs here, and that file isn't one.");
    const progress = demoActions.chatAdd({ from: "claude", text: "Reading your CV now. This usually takes under a minute." })[0];
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType: file.type, data: dataUrl.slice(dataUrl.indexOf(",") + 1) }),
      });
      const out = (await res.json()) as { profile?: ExtractedProfile; message?: string };
      if (!res.ok || !out.profile) return reopen(out.message ?? "I couldn't read that CV.");
      const p = out.profile;
      demoActions.chatSet({ ownCv: true });
      void saveFile("profile.json", JSON.stringify(p, null, 2));
      const split = (v: string) => v.split(/,|;| and /).map((x) => x.trim()).filter(Boolean);
      demoActions.setProfile({
        name: p.name,
        headline: p.headline,
        email: p.email,
        location: p.location,
        workAuthorization: p.workAuthorization,
        languages: p.languages,
        targetRoles: split(p.guesses.roles.value),
        targetCities: split(p.guesses.cities.value),
        summary: p.summary,
        experience: p.experience.map((e, i) => ({ ...e, id: `exp-${i}` })),
        education: p.education.map((e, i) => ({ ...e, id: `edu-${i}` })),
        skills: p.skills,
      });
      demoActions.chatSetText(progress, `Done. I read your CV${p.name ? `, ${p.name.split(" ")[0]}` : ""}.`);
      card({
        type: "guesses",
        roles: p.guesses.roles.value,
        cities: p.guesses.cities.value,
        salary: p.guesses.salary.value,
        reasons: { roles: p.guesses.roles.reason, cities: p.guesses.cities.reason, salary: p.guesses.salary.reason },
      });
    } catch {
      reopen("Something went wrong while reading your CV.");
    } finally {
      setBusy(false);
    }
  }

  // ---------- free text (scripted routing when Claude isn't connected) ----------

  function findJob(text: string) {
    const t = text.toLowerCase();
    return data.jobs.find(
      (j) => t.includes(j.company.split(" ")[0].toLowerCase()) || t.includes(j.title.toLowerCase()),
    )?.id;
  }

  function route(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setDraft("");
    if (live?.on) {
      void askClaude(q);
      return;
    }
    const t = q.toLowerCase();
    const jobId = findJob(q) ?? undefined;
    if (/\b(search|find|new jobs|look for)\b/.test(t)) return runSearch();
    if (/\bapply\b/.test(t)) {
      if (jobId) return startApply(jobId);
      you(q);
      return card({ type: "picker", purpose: "apply" });
    }
    if (/follow|heard back|no reply|haven'?t heard/.test(t)) {
      if (jobId) return startFollowUp(jobId);
      you(q);
      return card({ type: "picker", purpose: "followup" });
    }
    if (/interview|prep/.test(t) && !/question/.test(t)) {
      if (jobId) return startInterview(jobId);
      you(q);
      return card({ type: "picker", purpose: "interview" });
    }
    const about = jobId ?? getDemoState().chat.focusJob;
    you(q);
    if (about) {
      demoActions.chatSet({ focusJob: about });
      return card({ type: "answer", jobId: about, question: q });
    }
    say(
      "In this demo I can do a new search, apply to a job, answer a question about a specific job, follow up on an application, or prepare you for an interview. Name a company (like Maplewood) or pick one of the buttons below.",
    );
  }

  // ---------- boot, deep links, scrolling ----------

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const s = getDemoState();
    if (s.chat.items.length === 0) {
      card({ type: "intro" });
      return;
    }
    if (s.chat.items.some((i) => i.card?.type === "blocker" && i.card.done)) {
      raiseCheckIns();
      const ask = params.get("ask");
      const apply = params.get("apply");
      if (apply && data.jobs.some((j) => j.id === apply)) startApply(apply);
      else if (ask && data.jobs.some((j) => j.id === ask)) startAsk(ask);
    }
    // Runs once on first render; actions write to the external store, not React state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.items.length]);

  // ---------- render ----------

  function renderCard(item: ChatItem) {
    const c = item.card!;
    switch (c.type) {
      case "intro":
        return (
          <IntroCard
            started={chat.items.some((i) => i.card?.type === "upload")}
            onStart={() => {
              you("Let's go");
              card({ type: "upload" });
            }}
          />
        );
      case "upload":
        return (
          <UploadCard
            card={c}
            live={!!live?.on}
            onDone={(files, uploads) => {
              demoActions.chatUpdateCard(item.id, { files, done: true });
              const added = Object.entries(files).filter(([, v]) => v !== "skipped");
              you(`Uploaded ${added.map(([k]) => k).join(", ")}`);
              demoActions.markCvUploaded();
              // Keep the originals in this browser's private storage.
              Object.values(uploads).forEach((f) => void saveFile(`uploads/${f.name}`, f));
              if (live?.on && uploads.CV) void readCv(item.id, uploads.CV);
              else card({ type: "guesses" });
            }}
          />
        );
      case "guesses":
        return (
          <GuessesCard
            card={c}
            profile={getDemoState().profile ?? data.profile}
            onDone={(v) => {
              demoActions.chatUpdateCard(item.id, { ...v, done: true });
              you("Looks right, confirm");
              card({ type: "blocker" });
            }}
          />
        );
      case "blocker":
        return (
          <BlockerCard
            card={c}
            onAnswer={(pref, label) => {
              demoActions.chatUpdateCard(item.id, { done: true });
              demoActions.chatSet({ blockerPref: pref });
              you(label);
              if (live?.on) {
                void askClaude("Setup is done. Please run my first job search.", false);
              } else {
                say("Got it. You can change this anytime in Settings. Starting your first search now.");
                runSearch();
              }
            }}
          />
        );
      case "search":
        return (
          <SearchCard
            card={c}
            data={data}
            onApply={startApply}
            onAsk={startAsk}
            onAskLive={
              live?.on
                ? (p) => !busy && void askClaude(`Tell me more about ${p.title} at ${p.company || "this employer"}. Is it a good fit for me?`)
                : undefined
            }
          />
        );
      case "picker":
        return (
          <PickerCard card={c} data={data} jobIds={pickerJobs[c.purpose]()} onPick={(id) => pick(item.id, c.purpose, id)} />
        );
      case "apply":
        return <ApplyCard card={c} data={data} itemId={item.id} />;
      case "answer":
        return <AnswerCard card={c} data={data} />;
      case "checkIn":
        return (
          <CheckInCard
            card={c}
            data={data}
            onAnswer={(status, label) => checkInAnswer(item.id, c.jobId, status, label)}
          />
        );
      case "followUpEmail":
        return <FollowUpEmailCard card={c} data={data} itemId={item.id} />;
      case "kind":
        return <KindCard card={c} data={data} />;
      case "interview":
        return <InterviewCard card={c} data={data} />;
      default:
        return null;
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Chat</h1>
          <p className="flex flex-wrap items-center gap-2 text-[14px] text-muted">
            {live === null ? (
              "Checking the connection…"
            ) : live.on ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-sage-soft px-2 py-0.5 text-sage">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sage" /> Connected to Claude
                </span>
                Typed messages go to Claude; buttons and cards work as before.
              </>
            ) : (
              <>
                <span className="rounded-md bg-surface-2 px-2 py-0.5">Scripted demo</span>
                {live.reason}
              </>
            )}
          </p>
        </div>
        {chat.items.length > 1 && (
          <button
            type="button"
            className={btnQuiet}
            onClick={() => {
              demoActions.chatRestart();
              demoActions.clearProfile();
              void deleteAllFiles();
              Object.keys(decisions).forEach((id) => demoActions.undo(id));
              card({ type: "intro" });
            }}
          >
            Restart the demo
          </button>
        )}
      </div>

      <ol className="flex-1 space-y-5" aria-live="polite">
        {chat.items.map((item) =>
          item.from === "you" ? (
            <li key={item.id} className="settle flex justify-end">
              <p className="max-w-[80%] bg-sage px-4 py-2.5 text-sage-ink">{item.text}</p>
            </li>
          ) : (
            <li key={item.id} className="settle flex gap-3">
              <span aria-hidden className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-mist text-[13px] font-semibold text-mist-ink">
                C
              </span>
              <div className="min-w-0 flex-1 border border-line bg-surface px-4 py-3.5 sm:px-5">
                <span className="sr-only">Claude: </span>
                {item.text && (
                  <div className={item.card ? "mb-3" : ""}>
                    <RichText text={item.text} />
                  </div>
                )}
                {item.card && renderCard(item)}
              </div>
            </li>
          ),
        )}
        {busy && (
          <li className="flex items-center gap-2 pl-10 text-[14px] text-muted">
            <span aria-hidden className="breathe-circle h-3.5 w-3.5 rounded-full bg-mist" />
            Claude is thinking…
          </li>
        )}
      </ol>
      <div ref={endRef} />

      <div className="sticky bottom-0 mt-6 border-t border-line bg-bg/95 pb-4 pt-3 backdrop-blur">
        {onboarded && (
          <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {starters.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => starter(s)}
                className={`${s === "Do a new search" ? btnPrimary : btnQuiet} shrink-0`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            route(draft);
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-input"
            rows={2}
            value={draft}
            disabled={!onboarded}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                route(draft);
              }
            }}
            placeholder={onboarded ? "Ask anything, or try “apply to Maplewood”…" : "Finish setting up your profile above to start chatting."}
            className="min-w-0 flex-1 resize-none rounded-md border border-line bg-surface px-3.5 py-2.5 focus:border-sage focus:outline-none disabled:opacity-60"
          />
          <button type="submit" className={`${btnPrimary} py-2.5`} disabled={!onboarded || !draft.trim() || busy}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
