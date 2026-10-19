"use client";

import { useEffect, useRef, useState } from "react";
import { draftApplicationAnswer } from "@/lib/application-answer";
import { closeAssistant, onAssistantRequest, openAssistant, useAssistantUi } from "@/lib/state/assistant-ui";
import { demoActions, getDemoState, useDemoState, type ChatMessage } from "@/lib/state/demo-store";
import type { Application, Evaluation, Job, Profile } from "@/lib/data";

export interface AssistantJob {
  job: Job;
  evaluation: Evaluation | null;
  application: Application | null;
  formQuestions: string[];
}

const generalPrompts = [
  "Which of my saved jobs fits me best, and why?",
  "Help me plan this week's applications without overdoing it.",
];

function jobPrompts(j: AssistantJob) {
  const prompts = [];
  if (j.application?.status === "applied") prompts.push("It's been a while since I applied. Draft a short follow-up email.");
  if (j.application?.status === "interview") prompts.push("What should I prepare for the interview?");
  prompts.push("How well do I fit this job, honestly?");
  prompts.push(...j.formQuestions.slice(0, 3));
  return prompts;
}

export function AssistantPanel({ jobs, sampleProfile }: { jobs: AssistantJob[]; sampleProfile: Profile }) {
  const { open } = useAssistantUi();
  const { assistant, decisions } = useDemoState();
  const [draft, setDraft] = useState("");
  const [live, setLive] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = live !== null;

  const byId = new Map(jobs.map((j) => [j.job.id, j]));
  const attached = assistant.attached.map((id) => byId.get(id)).filter((j): j is AssistantJob => !!j);
  // Only drafts (saved, not yet sent) can be attached from the picker.
  const isDraft = (j: AssistantJob) => {
    const d = decisions[j.job.id]?.decision;
    if (d === "applied" || d === "let-go") return false;
    return d === "saved" || j.application?.status === "saved";
  };
  const unattached = jobs.filter((j) => !assistant.attached.includes(j.job.id) && isDraft(j));
  const suggestions = attached.length ? jobPrompts(attached[attached.length - 1]) : generalPrompts;

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    // Read the saved state fresh: a button may have attached a job in this same click.
    const now = getDemoState();
    const sendAttached = now.assistant.attached.map((id) => byId.get(id)).filter((j): j is AssistantJob => !!j);
    const sendProfile = now.profile ?? sampleProfile;
    const history: ChatMessage[] = [...now.assistant.messages, { role: "you", text: q }];
    demoActions.addMessages({ role: "you", text: q });
    setDraft("");
    setLive("");

    let reply = "";
    let note: string | undefined;
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-20).map((m) => ({ role: m.role === "you" ? "user" : "assistant", content: m.text })),
          profile: sendProfile,
          jobs: sendAttached.map((j) => ({
            id: j.job.id,
            data: { posting: j.job, evaluation: j.evaluation, application: j.application, formQuestions: j.formQuestions },
          })),
        }),
      });
      if (res.status === 503) {
        // Claude isn't connected yet: answer from the local preview drafts instead.
        const j = sendAttached[sendAttached.length - 1];
        reply = j
          ? draftApplicationAnswer(q, sendProfile, j.job, j.evaluation).answer
          : "Attach a draft first (the + button above), and I can draft answers from it.";
        note = "Preview answer. Claude isn't connected yet: add ANTHROPIC_API_KEY to web/.env.local.";
      } else if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        reply = err?.message ?? "Something went wrong. Try again.";
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          reply += decoder.decode(value, { stream: true });
          setLive(reply);
        }
      }
    } catch {
      reply = "Couldn't reach the assistant. Check that the site is running and try again.";
    }
    demoActions.addMessages({ role: "helper", text: reply.trim(), basis: note });
    setLive(null);
  }

  // Questions sent by "Ask about this job" buttons elsewhere on the page.
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  useEffect(
    () =>
      onAssistantRequest((r) => {
        if (r.send) void sendRef.current(r.text);
        else setDraft(r.text);
      }),
    [],
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [assistant.messages.length, live]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAssistant();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function copy(i: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  if (!open) return null;

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-40 bg-ink/20 sm:bg-ink/10" onClick={closeAssistant} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Assistant"
        className="settle fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-surface shadow-xl sm:max-w-md"
      >
        <header className="flex items-center justify-between gap-3 bg-mist px-5 py-3.5">
          <div>
            <p className="font-display text-lg">Assistant</p>
            <p className="text-[13px] text-mist-ink">Ask anything about your jobs. Answers use only your profile.</p>
          </div>
          <button
            type="button"
            onClick={closeAssistant}
            className="rounded-md px-3 py-1.5 text-[14px] text-mist-ink hover:bg-surface/50"
            aria-label="Close assistant"
          >
            Close
          </button>
        </header>

        <div className="border-b border-line px-5 py-3">
          <p className="mb-2 text-[12px] font-medium tracking-wide text-muted">Drafts in this conversation</p>
          <div className="flex flex-wrap items-center gap-2">
            {attached.map((j) => (
              <span key={j.job.id} className="flex max-w-full items-center gap-1 rounded-md bg-sage-soft py-1 pl-3 pr-1 text-[13px] text-sage">
                <span className="truncate">
                  {j.job.title} · {j.job.company}
                </span>
                <button
                  type="button"
                  onClick={() => demoActions.detachJob(j.job.id)}
                  aria-label={`Remove ${j.job.title}`}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm hover:bg-sage/15"
                >
                  ×
                </button>
              </span>
            ))}
            {unattached.length === 0 && attached.length === 0 && (
              <span className="text-[13px] text-muted">No drafts yet. Save a job to ask about it here.</span>
            )}
            {unattached.length > 0 && (
              <select
                aria-label="Attach a draft"
                value=""
                onChange={(e) => e.target.value && demoActions.attachJob(e.target.value)}
                className="rounded-md border border-dashed border-line bg-surface px-3 py-1 text-[13px] text-muted"
              >
                <option value="">+ Attach a draft</option>
                {unattached.map((j) => (
                  <option key={j.job.id} value={j.job.id}>
                    {j.job.title} · {j.job.company}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4" aria-live="polite">
          {assistant.messages.length === 0 && !busy && (
            <p className="rounded-2xl bg-mist-soft px-4 py-3 text-[15px]">
              Attach a job and ask anything: a form question, a follow-up email, how it compares to another job, or
              what to ask in the interview. If I don&apos;t know something, I&apos;ll leave a blank instead of guessing.
            </p>
          )}
          {assistant.messages.map((m, i) => (
            <Bubble key={i} role={m.role}>
              <p className="whitespace-pre-line">{m.text}</p>
              {m.basis && <p className="mt-2 text-[12px] text-muted">{m.basis}</p>}
              {m.role === "helper" && (
                <button
                  type="button"
                  onClick={() => copy(i, m.text)}
                  className="mt-2 rounded-md bg-surface px-3 py-0.5 text-[12px] font-medium hover:bg-surface-2"
                >
                  {copied === i ? "Copied" : "Copy"}
                </button>
              )}
            </Bubble>
          ))}
          {busy &&
            (live ? (
              <Bubble role="helper">
                <p className="whitespace-pre-line">{live}</p>
              </Bubble>
            ) : (
              <div className="flex items-center gap-2 text-[14px] text-muted">
                <span aria-hidden className="breathe-circle h-3.5 w-3.5 rounded-full bg-mist" />
                Reading the posting and your profile…
              </div>
            ))}
          <div ref={endRef} />
        </div>

        <div className="space-y-2.5 border-t border-line bg-bg px-5 py-3.5">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy}
                onClick={() => send(s)}
                className="shrink-0 rounded-md bg-mist-soft px-3 py-1 text-[13px] text-mist-ink hover:bg-mist disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
          >
            <label htmlFor="assistant-input" className="sr-only">
              Your question
            </label>
            <textarea
              ref={inputRef}
              id="assistant-input"
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(draft);
                }
              }}
              placeholder={attached.length ? "Ask about the attached job…" : "Ask anything about your search…"}
              className="min-w-0 flex-1 resize-none rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-[15px] focus:border-sage focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || busy}
              className="rounded-md bg-sage px-4 py-2.5 text-[15px] font-medium text-sage-ink disabled:opacity-50"
            >
              Send
            </button>
          </form>
          {assistant.messages.length > 0 && (
            <button type="button" onClick={demoActions.clearConversation} className="text-[12px] text-muted hover:text-ink">
              Start a new conversation
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function Bubble({ role, children }: { role: ChatMessage["role"]; children: React.ReactNode }) {
  const you = role === "you";
  return (
    <div className={`flex ${you ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[15px] ${
          you ? "rounded-br-md bg-sage text-sage-ink" : "rounded-bl-md bg-mist-soft text-ink"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/** A button anywhere on the page that opens the assistant with a job attached. */
export function AskButton({
  jobId,
  prompt,
  send,
  className = "",
  children = "Ask about this job",
}: {
  jobId?: string;
  prompt?: string;
  send?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => openAssistant({ attach: jobId, prompt, send })}
      className={className}
    >
      {children}
    </button>
  );
}
