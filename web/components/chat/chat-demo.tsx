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
import type { ChatData } from "./chat-types";

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

  const onboarded = chat.items.some((i) => i.card?.type === "blocker" && i.card.done);

  function statusOf(jobId: string): Status {
    const d = getDemoState().decisions[jobId];
    if (d) return d.decision;
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
          (data.daysSinceApplied[id] ?? 0) >= 14 &&
          !s.decisions[id]?.followedUpAt &&
          !s.chat.checkedIn.includes(id),
      );
  }

  function raiseCheckIns() {
    const due = dueCheckIns();
    if (!due.length) return;
    demoActions.chatSet({ checkedIn: [...getDemoState().chat.checkedIn, ...due] });
    due.forEach((id) => card({ type: "checkIn", jobId: id }));
  }

  // ---------- actions ----------

  function runSearch() {
    const s = getDemoState();
    const now = new Date();
    const round = s.chat.searches.length;
    const searches = [...s.chat.searches, now.toISOString()];
    const sameDay = searches.filter((t) => new Date(t).toDateString() === now.toDateString()).length;
    const thisWeek = searches.filter((t) => now.getTime() - new Date(t).getTime() < 7 * 864e5).length;
    let encourage: { searched: number; applied: number } | undefined;
    if (sameDay > 2 || thisWeek > 3) {
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
    demoActions.chatSet({ searches, focusJob: null });
    you("Do a new search");
    card({ type: "search", round, encourage });
    if (round === 0) raiseCheckIns();
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

  // ---------- free text (scripted routing; real Claude replaces this) ----------

  function findJob(text: string) {
    const t = text.toLowerCase();
    return data.jobs.find(
      (j) => t.includes(j.company.split(" ")[0].toLowerCase()) || t.includes(j.title.toLowerCase()),
    )?.id;
  }

  function route(text: string) {
    const q = text.trim();
    if (!q) return;
    setDraft("");
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
            onDone={(files) => {
              demoActions.chatUpdateCard(item.id, { files, done: true });
              const added = Object.entries(files).filter(([, v]) => v !== "skipped");
              you(`Uploaded ${added.map(([k]) => k).join(", ")}`);
              demoActions.markCvUploaded();
              card({ type: "guesses" });
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
              say("Got it. You can change this anytime in Settings. Starting your first search now.");
              runSearch();
            }}
          />
        );
      case "search":
        return <SearchCard card={c} data={data} onApply={startApply} onAsk={startAsk} />;
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
          <p className="text-[14px] text-muted">
            Scripted demo: replies follow the plan&apos;s rules. Real Claude arrives with sign-in.
          </p>
        </div>
        {chat.items.length > 1 && (
          <button
            type="button"
            className={btnQuiet}
            onClick={() => {
              demoActions.chatRestart();
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
                {item.text && <p className={item.card ? "mb-3" : ""}>{item.text}</p>}
                {item.card && renderCard(item)}
              </div>
            </li>
          ),
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
          <button type="submit" className={`${btnPrimary} py-2.5`} disabled={!onboarded || !draft.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
