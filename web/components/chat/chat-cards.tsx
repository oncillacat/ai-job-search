"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { draftApplicationAnswer } from "@/lib/application-answer";
import { demoActions, useDemoState, type ChatCard } from "@/lib/state/demo-store";
import { saveFile } from "@/lib/state/local-files";
import type { BoardPosting, Profile } from "@/lib/data";
import type { LiveSearch, ScoredPosting } from "@/lib/search/types";
import type { ChatData } from "./chat-types";

// ---------- shared bits ----------

const btn =
  "inline-flex items-center justify-center rounded-md px-3.5 py-1.5 text-[14px] font-medium transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${btn} bg-sage text-sage-ink hover:opacity-90`;
export const btnQuiet = `${btn} bg-surface-2 text-ink hover:bg-line`;
export const btnGhost = `${btn} text-muted hover:bg-surface-2 hover:text-ink`;

export function Box({ children, tint }: { children: ReactNode; tint?: "mist" | "sage" | "clay" | "sand" }) {
  const t =
    tint === "mist"
      ? "bg-mist-soft"
      : tint === "sage"
        ? "bg-sage-soft"
        : tint === "clay"
          ? "bg-clay-soft"
          : tint === "sand"
            ? "bg-sand"
            : "border border-line bg-surface";
  return <div className={`mt-3 p-4 ${t}`}>{children}</div>;
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={btnQuiet}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

// ---------- first run ----------

export function IntroCard({ onStart, started }: { onStart: () => void; started: boolean }) {
  return (
    <div>
      <p className="font-display text-xl">Hi, I&apos;m your job search assistant.</p>
      <p className="mt-2">Here&apos;s how this works, in three short steps:</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>
          <strong>Your profile.</strong> Upload your CV. Other documents are optional.
        </li>
        <li>
          <strong>A quick check.</strong> I&apos;ll guess what you&apos;re looking for from your CV, show you why, and
          wait for you to confirm.
        </li>
        <li>
          <strong>Your first search.</strong> I&apos;ll show only the jobs that fit you well, and tell you how many I
          looked at.
        </li>
      </ol>
      <Box tint="mist">
        <p>
          <strong>More information means better results.</strong> Your transcript, certificates, awards, LinkedIn
          profile and publications help me find better matches and write better cover letters. Each one is optional;
          you can skip any of them.
        </p>
      </Box>
      <button type="button" className={`${btnPrimary} mt-4`} onClick={onStart} disabled={started}>
        Let&apos;s go
      </button>
    </div>
  );
}

const optionalDocs = ["Transcript", "Graduation certificate", "Awards", "LinkedIn profile", "Publications"];

export function UploadCard({
  card,
  live,
  onDone,
}: {
  card: Extract<ChatCard, { type: "upload" }>;
  /** True when Claude is connected and will actually read the CV */
  live: boolean;
  onDone: (files: Record<string, string | "skipped">, uploads: Record<string, File>) => void;
}) {
  const [files, setFiles] = useState<Record<string, string | "skipped">>(card.files ?? {});
  const [uploads, setUploads] = useState<Record<string, File>>({});
  const done = !!card.done;

  function renderRow(name: string, required = false) {
    const value = done ? (card.files ?? files)[name] : files[name];
    const inputId = `upload-${name.replace(/\W+/g, "-").toLowerCase()}`;
    return (
      <li key={name} className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2.5 first:border-t-0">
        <span>
          <span className="font-medium">{name}</span>{" "}
          <span className="text-[13px] text-muted">{required ? "Required" : "Optional"}</span>
          {value && (
            <span className="block text-[13px] text-sage">{value === "skipped" ? "Skipped" : `✓ ${value}`}</span>
          )}
        </span>
        {!done && (
          <span className="flex flex-wrap gap-1.5">
            <label htmlFor={inputId} className={`${btnQuiet} cursor-pointer`}>
              {value && value !== "skipped" ? "Replace" : "Upload"}
            </label>
            <input
              id={inputId}
              type="file"
              className="sr-only"
              accept=".pdf,.doc,.docx,.png,.jpg"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFiles((s) => ({ ...s, [name]: f.name }));
                setUploads((s) => ({ ...s, [name]: f }));
              }}
            />
            {required ? (
              // With Claude connected there is no sample person: only the person's own CV.
              !value && !live && (
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    setUploads((s) => {
                      const rest = { ...s };
                      delete rest.CV;
                      return rest;
                    });
                    setFiles((s) => ({ ...s, [name]: "sample-cv.pdf" }));
                  }}
                >
                  Use a sample CV
                </button>
              )
            ) : (
              value !== "skipped" && (
                <button type="button" className={btnGhost} onClick={() => setFiles((s) => ({ ...s, [name]: "skipped" }))}>
                  Skip
                </button>
              )
            )}
          </span>
        )}
      </li>
    );
  }

  const hasCv = !!files.CV && files.CV !== "skipped";
  return (
    <div>
      <p>
        First, your profile. I only need your <strong>CV</strong>. Add anything else you&apos;d like me to know, or skip
        it.{" "}
        {live
          ? "I'll send your CV (PDF) to Claude to read it. Your files and what I learn are kept in this browser's private storage, not on a server."
          : "Your files are kept in this browser's private storage, not on a server."}
      </p>
      <ul className="mt-3 border border-line bg-surface px-4">
        {renderRow("CV", true)}
        {optionalDocs.map((d) => renderRow(d))}
      </ul>
      {!done && (
        <button
          type="button"
          className={`${btnPrimary} mt-3`}
          disabled={!hasCv}
          onClick={() => {
            const all = { ...files };
            optionalDocs.forEach((d) => {
              if (!all[d]) all[d] = "skipped";
            });
            onDone(all, uploads);
          }}
        >
          Continue
        </button>
      )}
    </div>
  );
}

function guessesFor(profile: Profile) {
  const current = profile.experience[0];
  const degree = profile.education[0];
  return {
    roles: {
      value: "Health Data Analyst, Research Analyst, Biostatistician",
      reason: `Your current role is ${current?.title ?? "an analyst role"} at ${current?.org ?? "your current employer"}${
        degree ? `, and your ${degree.degree.replace(", ", " in ")} points toward research and biostatistics roles` : ""
      }.`,
    },
    cities: {
      value: profile.location,
      reason: `Your CV lists ${profile.location} as where you live. Want me to search for jobs in ${profile.location.split(",")[0]}?`,
    },
    salary: {
      value: "",
      reason: "Your CV doesn't mention pay, so I won't guess. Add a range if you'd like me to filter by it, or leave it empty.",
    },
  };
}

export function GuessesCard({
  card,
  profile,
  onDone,
}: {
  card: Extract<ChatCard, { type: "guesses" }>;
  profile: Profile;
  onDone: (v: { roles: string; cities: string; salary: string }) => void;
}) {
  const fromCv = card.reasons
    ? {
        roles: { value: card.roles ?? "", reason: card.reasons.roles },
        cities: { value: card.cities ?? "", reason: card.reasons.cities },
        salary: { value: card.salary ?? "", reason: card.reasons.salary },
      }
    : null;
  const g = fromCv ?? guessesFor(profile);
  const [roles, setRoles] = useState(card.roles ?? g.roles.value);
  const [cities, setCities] = useState(card.cities ?? g.cities.value);
  const [salary, setSalary] = useState(card.salary ?? g.salary.value);
  const done = !!card.done;
  const rows: { key: string; label: string; value: string; set: (v: string) => void; reason: string; placeholder?: string }[] = [
    { key: "roles", label: "Roles", value: roles, set: setRoles, reason: g.roles.reason },
    { key: "cities", label: "Where", value: cities, set: setCities, reason: g.cities.reason },
    { key: "salary", label: "Salary", value: salary, set: setSalary, reason: g.salary.reason, placeholder: "e.g. $70,000 – $85,000 (optional)" },
  ];
  return (
    <div>
      <p>
        Thanks. I read your CV. Here&apos;s what I think you&apos;re looking for, and why. I&apos;ll only search once
        you confirm.
      </p>
      <div className="mt-3 space-y-3">
        {rows.map((r) => (
          <div key={r.key} className="border border-line bg-surface p-4">
            <label htmlFor={`guess-${r.key}`} className="text-[13px] font-medium tracking-wide text-muted">
              {r.label}
            </label>
            <input
              id={`guess-${r.key}`}
              value={r.value}
              placeholder={r.placeholder}
              disabled={done}
              onChange={(e) => r.set(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 focus:border-sage focus:outline-none disabled:opacity-80"
            />
            <p className="mt-1.5 text-[14px] text-muted">
              <span className="font-medium text-ink">Why: </span>
              {r.reason}
            </p>
          </div>
        ))}
      </div>
      {!done ? (
        <button type="button" className={`${btnPrimary} mt-3`} onClick={() => onDone({ roles, cities, salary })}>
          Looks right, confirm
        </button>
      ) : (
        <p className="mt-2 text-[14px] text-sage">✓ Confirmed</p>
      )}
    </div>
  );
}

export function BlockerCard({
  card,
  onAnswer,
}: {
  card: Extract<ChatCard, { type: "blocker" }>;
  onAnswer: (pref: "prepare" | "skip", label: string) => void;
}) {
  return (
    <div>
      <p>One last question, so you decide it calmly now rather than in the moment:</p>
      <p className="mt-2 font-display text-lg">
        If a job has a hard blocker, like a citizenship requirement or a missing must-have skill, should I still prepare
        the application?
      </p>
      {!card.done && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} onClick={() => onAnswer("prepare", "Yes, still prepare them")}>
            Yes, still prepare them
          </button>
          <button type="button" className={btnQuiet} onClick={() => onAnswer("skip", "No, skip those")}>
            No, skip those
          </button>
          <button type="button" className={btnGhost} onClick={() => onAnswer("prepare", "Decide later")}>
            Decide later (I&apos;ll prepare them)
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- search ----------

function JobTable({
  rows,
  data,
  onApply,
  onAsk,
}: {
  rows: BoardPosting[];
  data: ChatData;
  onApply: (jobId: string) => void;
  onAsk: (jobId: string) => void;
}) {
  const { decisions } = useDemoState();
  return (
    <div className="mt-3 overflow-x-auto border border-line bg-surface">
      <table className="w-full min-w-[900px] border-collapse text-[14px]">
        <thead>
          <tr className="text-left text-[12px] tracking-wide text-muted">
            {["Title", "Company", "Location", "Portal", "Posted", "Fit", "Link", ""].map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const score = r.jobId ? data.evaluations[r.jobId]?.score : undefined;
            return (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="min-w-[220px] px-3 py-2.5 font-medium">
                  {r.jobId ? (
                    <Link href={`/jobs/${r.jobId}`} className="hover:text-sage">
                      {r.title}
                    </Link>
                  ) : (
                    r.title
                  )}
                  {r.note && <span className="mt-0.5 block text-[13px] font-normal text-muted">{r.note}</span>}
                </td>
                <td className="px-3 py-2.5">{r.company}</td>
                <td className="px-3 py-2.5 text-muted">{r.location}</td>
                <td className="px-3 py-2.5 text-muted">{r.source}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted">{r.posted}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <span className={r.fit === "high" ? "font-medium text-sage" : "text-mist-ink"}>
                    {r.fit === "high" ? "High" : "Medium"}
                  </span>
                  {score && <span className="ml-1 tabular-nums text-muted">{score}</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {r.jobId ? (
                    <a href={`/careers/${r.jobId}`} target="_blank" rel="noopener noreferrer" className="text-sage hover:underline">
                      Posting ↗
                    </a>
                  ) : (
                    <span className="text-muted">Sample only</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {r.jobId && (
                    <span className="flex gap-1">
                      {data.tailored[r.jobId] && (
                        <button type="button" className={btnPrimary} onClick={() => onApply(r.jobId!)}>
                          Apply
                        </button>
                      )}
                      <button type="button" className={btnQuiet} onClick={() => onAsk(r.jobId!)}>
                        Ask
                      </button>
                      <button
                        type="button"
                        className={btnGhost}
                        disabled={!!decisions[r.jobId]}
                        onClick={() => demoActions.decide(r.jobId!, "saved")}
                      >
                        {decisions[r.jobId] ? "Saved" : "Save"}
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const shortDate = (iso: string) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" }) : "—";

export function LiveTable({
  rows,
  onAsk,
  onApply,
  markApplied,
}: {
  rows: ScoredPosting[];
  onAsk?: (p: ScoredPosting) => void;
  /** Prepare an application in the chat; without it, Apply links to the chat */
  onApply?: (p: ScoredPosting) => void;
  /** Offer "Mark as applied" (on the dashboard) */
  markApplied?: boolean;
}) {
  const { chat } = useDemoState();
  const saved = new Set((chat.saved ?? []).map((x) => x.id));
  const appliedAt = new Map((chat.saved ?? []).flatMap((x) => (x.appliedAt ? [[x.id, x.appliedAt] as const] : [])));
  // Postings already prepared: open that card instead of preparing again.
  const prepared = new Map(
    chat.items.flatMap((i) => (i.card?.type === "tailor" && i.card.result ? [[i.card.posting.id, i.id] as const] : [])),
  );
  return (
    <div className="mt-3 overflow-x-auto border border-line bg-surface">
      <table className="w-full min-w-[900px] border-collapse text-[14px]">
        <thead>
          <tr className="text-left text-[12px] tracking-wide text-muted">
            {["Title", "Company", "Location", "Portal", "Posted", "Fit", "Link", ""].map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-line align-top">
              <td className="min-w-[220px] px-3 py-2.5 font-medium">
                {r.title}
                <span className="mt-0.5 block text-[13px] font-normal text-muted">{r.reason}</span>
                {r.gaps.length > 0 && (
                  <span className="mt-0.5 block text-[13px] font-normal text-clay">To check: {r.gaps.join("; ")}</span>
                )}
              </td>
              <td className="px-3 py-2.5">{r.company || "—"}</td>
              <td className="px-3 py-2.5 text-muted">{r.location || "—"}</td>
              <td className="px-3 py-2.5 text-muted">
                {r.portal}
                {r.via && <span className="block text-[12px]">via {r.via}</span>}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted">{shortDate(r.posted)}</td>
              <td className="whitespace-nowrap px-3 py-2.5">
                <span className={r.fit === "high" ? "font-medium text-sage" : "text-mist-ink"}>
                  {r.fit === "high" ? "High" : "Medium"}
                </span>
                {r.score > 0 && <span className="ml-1 tabular-nums text-muted">{r.score}</span>}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                {/^https:\/\//.test(r.url) ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sage hover:underline">
                    Posting ↗
                  </a>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                <span className="flex gap-1">
                  {appliedAt.has(r.id) ? (
                    <span className="self-center whitespace-nowrap px-2 font-medium text-sage">
                      ✓ Applied {new Date(appliedAt.get(r.id)!).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                    </span>
                  ) : prepared.has(r.id) ? (
                    <Link href={`/chat#item-${prepared.get(r.id)}`} className={btnPrimary}>
                      Review
                    </Link>
                  ) : onApply ? (
                    <button type="button" className={btnPrimary} onClick={() => onApply(r)}>
                      Apply
                    </button>
                  ) : (
                    <Link href={`/chat?prepare=${encodeURIComponent(r.id)}`} className={btnPrimary}>
                      Apply
                    </Link>
                  )}
                  {markApplied && !appliedAt.has(r.id) && (
                    <button type="button" className={btnQuiet} onClick={() => demoActions.markPostingApplied(r)}>
                      Mark as applied
                    </button>
                  )}
                  {onAsk && (
                    <button type="button" className={btnQuiet} onClick={() => onAsk(r)}>
                      Ask
                    </button>
                  )}
                  {appliedAt.has(r.id) ? null : saved.has(r.id) ? (
                    <button type="button" className={btnGhost} onClick={() => demoActions.unsavePosting(r.id)}>
                      Saved ✓
                    </button>
                  ) : (
                    <button type="button" className={btnGhost} onClick={() => demoActions.savePosting(r)}>
                      Save
                    </button>
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Real results from the live search. Claude writes the headline around it. */
function LiveResults({
  live,
  onAsk,
  onApply,
}: {
  live: LiveSearch;
  onAsk?: (p: ScoredPosting) => void;
  onApply?: (p: ScoredPosting) => void;
}) {
  const portals = live.sources.filter((s) => s.status === "ok");
  const rows = live.high.length ? live.high : live.medium.slice(0, 10);
  const moreMedium = live.high.length ? live.medium : live.medium.slice(10);
  return (
    <div>
      <p className="text-[14px] text-muted">
        Searched {portals.map((s) => `${s.name} (${s.count})`).join(", ") || "no portals"} for{" "}
        {live.query.roles.join(" / ")}
        {live.query.cities.length ? ` in ${live.query.cities.join(" / ")}` : ""} · <strong className="text-ink">{live.searched}</strong>{" "}
        new postings · {live.closeLook} read closely · {live.tiers.high} high · {live.tiers.medium} medium · {live.tiers.low} low
      </p>
      {live.notice && <p className="mt-2 border-l-2 border-sand-ink/40 pl-3 text-[14px] text-sand-ink">{live.notice}</p>}
      {rows.length > 0 && <LiveTable rows={rows} onAsk={onAsk} onApply={onApply} />}
      {moreMedium.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[14px] text-sage">
            {live.high.length ? `Show the ${moreMedium.length} medium matches` : `Show ${moreMedium.length} more medium matches`}
          </summary>
          <LiveTable rows={moreMedium} onAsk={onAsk} onApply={onApply} />
        </details>
      )}
      <p className="mt-3 text-[14px] text-muted">
        Fit is judged from each listing&apos;s title, employer, location and short description. Open a posting to check
        the full requirements. Low matches aren&apos;t shown.
      </p>
    </div>
  );
}

export function SearchCard({
  card,
  data,
  onApply,
  onAsk,
  onAskLive,
  onApplyLive,
}: {
  card: Extract<ChatCard, { type: "search" }>;
  data: ChatData;
  onApply: (jobId: string) => void;
  onAsk: (jobId: string) => void;
  onAskLive?: (p: ScoredPosting) => void;
  onApplyLive?: (p: ScoredPosting) => void;
}) {
  if (card.live) return <LiveResults live={card.live} onAsk={onAskLive} onApply={onApplyLive} />;
  const round = data.rounds[Math.min(card.round, data.rounds.length - 1)];
  const searched = round.sources.reduce((n, s) => n + s.count, 0);
  const portals = round.sources.filter((s) => s.count > 0);
  const repeatNothing = card.round >= data.rounds.length - 1 && round.medium.length === 0 && round.high.length === 0;

  if (card.byClaude) {
    // Claude writes the headline and any encouragement around this card; the card shows the data.
    return (
      <div>
        <p className="text-[14px] text-muted">
          Searched {portals.map((s) => `${s.name} (${s.count})`).join(", ")} · <strong className="text-ink">{searched}</strong> new
          postings · {round.tiers.high} high · {round.tiers.medium} medium · {round.tiers.low} low
        </p>
        {round.notice && <p className="mt-2 border-l-2 border-sand-ink/40 pl-3 text-[14px] text-sand-ink">{round.notice}</p>}
        {round.high.length > 0 && <JobTable rows={round.high} data={data} onApply={onApply} onAsk={onAsk} />}
        {round.high.length === 0 && round.medium.length > 0 && (
          <JobTable rows={round.medium.slice(0, 10)} data={data} onApply={onApply} onAsk={onAsk} />
        )}
        <p className="mt-3 text-[14px] text-muted">
          The rest are on your{" "}
          <Link href="/dashboard#today" className="text-sage underline-offset-4 hover:underline">
            dashboard
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      {round.high.length > 0 ? (
        <p className="font-display text-lg">
          {round.high.length === 1 ? "One strong match" : `${round.high.length} strong matches`} for you today.
        </p>
      ) : repeatNothing ? (
        <p className="font-display text-lg">Nothing new worth your time since your last search.</p>
      ) : (
        <p className="font-display text-lg">No new strong matches today.</p>
      )}
      <p className="mt-2">
        I searched {portals.length} portals ({portals.map((s) => `${s.name} ${s.count}`).join(", ")}) and looked
        through <strong>{searched} new postings</strong> you haven&apos;t seen before.{" "}
        {round.tiers.high} matched you well, {round.tiers.medium} were medium matches, and {round.tiers.low} were low.
      </p>
      {round.notice && <p className="mt-2 border-l-2 border-sand-ink/40 pl-3 text-[14px] text-sand-ink">{round.notice}</p>}

      {round.high.length > 0 && <JobTable rows={round.high} data={data} onApply={onApply} onAsk={onAsk} />}

      {round.high.length === 0 && round.medium.length > 0 && (
        <>
          <p className="mt-3">Here are the closest medium matches, in case one is worth a look:</p>
          <JobTable rows={round.medium.slice(0, 10)} data={data} onApply={onApply} onAsk={onAsk} />
        </>
      )}

      <p className="mt-3 text-[14px] text-muted">
        Everything else from today is on your{" "}
        <Link href="/dashboard#today" className="text-sage underline-offset-4 hover:underline">
          dashboard
        </Link>
        . Search again anytime with &ldquo;Do a new search&rdquo;; you&apos;ll only see jobs you haven&apos;t seen.
      </p>

      {card.encourage && (
        <Box tint="sage">
          <p>
            This week you&apos;ve looked through <strong>{card.encourage.searched} postings</strong> and applied to{" "}
            <strong>
              {card.encourage.applied} {card.encourage.applied === 1 ? "job" : "jobs"}
            </strong>
            . That&apos;s real, steady effort. A quiet day says more about the market than about you.
          </p>
        </Box>
      )}
    </div>
  );
}

// ---------- apply ----------

const applySteps = ["Checking how well you fit", "Tailoring your CV and cover letter", "Answering the form questions"];

// Cards already in the thread when the page loads (not just added) skip the progress animation.
const mountedAt = typeof window === "undefined" ? 0 : Date.now();
function appliedBefore(itemId: string) {
  const created = parseInt(itemId.split("-")[0], 36);
  return Number.isFinite(created) && created < mountedAt - 2000;
}

export function ApplyCard({
  card,
  data,
  itemId,
}: {
  card: Extract<ChatCard, { type: "apply" }>;
  data: ChatData;
  itemId: string;
}) {
  const { profile: stored, chat } = useDemoState();
  const job = data.jobs.find((j) => j.id === card.jobId);
  const evaluation = data.evaluations[card.jobId] ?? null;
  const docs = data.tailored[card.jobId];
  // A card restored from history shows finished; a new one plays its progress once.
  const [step, setStep] = useState(() => (card.submitted || appliedBefore(itemId) ? applySteps.length : 0));

  useEffect(() => {
    const timers = applySteps.map((_, i) => setTimeout(() => setStep((s) => Math.max(s, i + 1)), 700 * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, []);

  const profile = stored ?? data.profile;
  const ready = step >= applySteps.length;
  const questions = job ? (data.questions[job.id] ?? []) : [];
  const answersText = job
    ? questions.map((q) => `${q}\n${draftApplicationAnswer(q, profile, job, evaluation).answer}`).join("\n\n")
    : "";

  // Keep a copy of the prepared answers in the browser's private storage.
  useEffect(() => {
    if (ready && job && answersText) void saveFile(`generated/${job.id}/form-answers.txt`, answersText);
  }, [ready, job, answersText]);

  if (!job) return null;
  const blocked = evaluation?.eligibility.status === "fail";

  return (
    <div>
      <p>
        On it. I&apos;ll prepare everything for <strong>{job.title}</strong> at {job.company}, then you review it and press
        Submit yourself.
      </p>
      <ul className="mt-3 space-y-1 text-[14px]" aria-live="polite">
        {applySteps.map((s, i) => (
          <li key={s} className={i < step ? "text-ink" : "text-muted/60"}>
            {i < step ? "✓" : "·"} {s}
          </li>
        ))}
      </ul>

      {ready && (
        <div className="settle">
          {blocked && chat.blockerPref === "skip" ? (
            <Box tint="sand">
              <p>
                This job has a hard blocker ({evaluation?.eligibility.note}). You asked me to skip jobs like this, so I
                stopped here.
              </p>
            </Box>
          ) : (
            <>
              <Box>
                <p className="text-[13px] font-medium tracking-wide text-muted">1 · Fit</p>
                <p className="mt-1 font-medium">
                  {evaluation?.headline} <span className="text-muted">Fit {evaluation?.score}/100.</span>
                </p>
                <ul className="mt-1 list-disc pl-5 text-[14px]">
                  {evaluation?.reasons.slice(0, 2).map((r) => <li key={r}>{r}</li>)}
                </ul>
              </Box>

              <Box>
                <p className="text-[13px] font-medium tracking-wide text-muted">2 · CV and cover letter</p>
                {docs ? (
                  <>
                    <ul className="mt-1 space-y-0.5 text-[14px]">
                      {docs.checks.map((c) => (
                        <li key={c.label}>
                          <span className="text-sage">✓</span> {c.label}
                        </li>
                      ))}
                    </ul>
                    <Link href={`/jobs/${job.id}/tailor`} className={`${btnQuiet} mt-3`}>
                      Review and edit your CV
                    </Link>
                  </>
                ) : (
                  <p className="mt-1 text-[14px] text-muted">Tailored documents for this job aren&apos;t in the demo yet.</p>
                )}
              </Box>

              <Box>
                <p className="text-[13px] font-medium tracking-wide text-muted">3 · Answers for the application form</p>
                <ul className="mt-2 space-y-3">
                  {questions.map((q) => {
                    const a = draftApplicationAnswer(q, profile, job, evaluation);
                    return (
                      <li key={q}>
                        <p className="text-[14px] font-medium">{q}</p>
                        <p className="mt-0.5 whitespace-pre-line text-[14px]">{a.answer}</p>
                        {a.check && <p className="mt-0.5 text-[13px] text-sand-ink">Before pasting: {a.check}</p>}
                      </li>
                    );
                  })}
                </ul>
              </Box>

              {evaluation && evaluation.gaps.length > 0 && (
                <Box tint="clay">
                  <p className="font-medium">An honest gap</p>
                  <p className="mt-1 text-[14px]">{evaluation.gaps[0]}</p>
                </Box>
              )}
              {blocked && (
                <Box tint="sand">
                  <p className="text-[14px]">
                    A kind reminder: this job lists a hard requirement you may not meet ({evaluation?.eligibility.note}).
                    I prepared it anyway, as you asked. It&apos;s your call.
                  </p>
                </Box>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a href={`/careers/${job.id}`} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
                  Open the application ↗
                </a>
                {card.submitted ? (
                  <span className="text-[14px] text-sage">✓ Marked as submitted. It&apos;s on your dashboard.</span>
                ) : (
                  <button
                    type="button"
                    className={btnQuiet}
                    onClick={() => {
                      demoActions.decide(job.id, "applied");
                      demoActions.chatUpdateCard(itemId, { submitted: true });
                    }}
                  >
                    I submitted it
                  </button>
                )}
              </div>
              <p className="mt-2 text-[13px] text-muted">
                The form opens in a new tab. Its &ldquo;fill from AI Job Search&rdquo; shortcut pastes these answers in.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- questions, follow-ups, interviews ----------

export function AnswerCard({ card, data }: { card: Extract<ChatCard, { type: "answer" }>; data: ChatData }) {
  const { profile: stored } = useDemoState();
  const job = data.jobs.find((j) => j.id === card.jobId);
  if (!job) return null;
  const a = draftApplicationAnswer(card.question, stored ?? data.profile, job, data.evaluations[job.id] ?? null);
  return (
    <div>
      <p className="text-[13px] text-muted">
        About {job.title} · {job.company}
      </p>
      <p className="mt-1 whitespace-pre-line">{a.answer}</p>
      <p className="mt-2 text-[13px] text-muted">Based on: {a.basis}</p>
      {a.check && <p className="mt-1 text-[13px] text-sand-ink">Before using it: {a.check}</p>}
      <div className="mt-2">
        <CopyButton text={a.answer} />
      </div>
    </div>
  );
}

/** The person's own application date and days since, or the sample data's for the sample person. */
function useApplied(data: ChatData, jobId: string) {
  const { decisions, chat } = useDemoState();
  const d = decisions[jobId];
  if (d?.decision === "applied" || d?.decision === "interview" || d?.decision === "offer" || d?.decision === "rejected") {
    const at = new Date(d.at);
    return {
      on: at.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
      days: Math.floor((Date.now() - at.getTime()) / 864e5),
      app: chat.ownCv ? undefined : data.applications.find((a) => a.jobId === jobId),
    };
  }
  if (chat.ownCv) return { on: undefined, days: undefined, app: undefined };
  const app = data.applications.find((a) => a.jobId === jobId);
  return { on: app?.appliedOn, days: data.daysSinceApplied[jobId], app };
}

export function CheckInCard({
  card,
  data,
  onAnswer,
}: {
  card: Extract<ChatCard, { type: "checkIn" }>;
  data: ChatData;
  onAnswer: (status: "none" | "interview" | "offer" | "rejected", label: string) => void;
}) {
  const job = data.jobs.find((j) => j.id === card.jobId);
  const applied = useApplied(data, card.jobId);
  if (!job) return null;
  return (
    <div>
      <p>
        You applied to <strong>{job.title}</strong> at {job.company}
        {applied.on ? ` on ${applied.on}` : ""}
        {(applied.days ?? 0) >= 14
          ? ", and I haven't seen an update in over two weeks."
          : `${applied.days !== undefined ? ` (${applied.days} days ago)` : ""}. Most replies take two to three weeks, so following up now is optional.`}
      </p>
      <p className="mt-2 font-display text-lg">Have you heard back from {job.company}?</p>
      {!card.done ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={btnQuiet} onClick={() => onAnswer("none", "No reply yet")}>
            No reply yet
          </button>
          <button type="button" className={btnQuiet} onClick={() => onAnswer("interview", "I got an interview")}>
            Interview
          </button>
          <button type="button" className={btnQuiet} onClick={() => onAnswer("offer", "I got an offer")}>
            Offer
          </button>
          <button type="button" className={btnQuiet} onClick={() => onAnswer("rejected", "They said no")}>
            Rejected
          </button>
        </div>
      ) : (
        <p className="mt-2 text-[14px] text-sage">✓ {card.done}</p>
      )}
    </div>
  );
}

export function FollowUpEmailCard({
  card,
  data,
  itemId,
}: {
  card: Extract<ChatCard, { type: "followUpEmail" }>;
  data: ChatData;
  itemId: string;
}) {
  const { profile: stored } = useDemoState();
  const job = data.jobs.find((j) => j.id === card.jobId);
  const applied = useApplied(data, card.jobId);
  const app = applied.app;
  const name = (stored ?? data.profile).name;
  const contact = app?.contact?.split(",")[0];
  const email = job
    ? `Subject: Following up on my application for ${job.title}

Dear ${contact ?? "Hiring Team"},

I applied for the ${job.title} position${applied.on ? ` on ${applied.on}` : ""} and wanted to follow up. I'm still very interested in the role and in contributing to ${job.company}'s work.

If it would help, I'm happy to share anything else about my experience. Thank you for your time.

Best regards,
${name}`
    : "";

  // Keep a copy of the draft in the browser's private storage.
  useEffect(() => {
    if (job && email) void saveFile(`generated/${job.id}/follow-up-email.txt`, email);
  }, [job, email]);

  if (!job) return null;
  const days = applied.days;
  return (
    <div>
      <p>
        {(days ?? 14) >= 14
          ? "Two weeks without news is normal, and a short, polite follow-up is completely fine. Here's a draft:"
          : `It's been ${days} days, so there's no rush. Here's a draft to keep for when it's been about two weeks:`}
      </p>
      <pre className="mt-3 whitespace-pre-wrap border border-line bg-surface p-4 font-sans text-[14px]">{email}</pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton text={email} label="Copy email" />
        {card.done ? (
          <span className="self-center text-[14px] text-sage">✓ Marked as followed up</span>
        ) : (
          <button
            type="button"
            className={btnQuiet}
            onClick={() => {
              demoActions.followedUp(job.id);
              demoActions.chatUpdateCard(itemId, { done: true });
            }}
          >
            Mark as followed up
          </button>
        )}
      </div>
    </div>
  );
}

export function KindCard({ card, data }: { card: Extract<ChatCard, { type: "kind" }>; data: ChatData }) {
  const job = data.jobs.find((j) => j.id === card.jobId);
  // EARLY VERSION: placeholder kind words, to be rewritten (see docs/plan-chat-first.md, "Still open").
  return (
    <p>
      I&apos;m sorry about {job?.company ?? "this one"}. You put real care into that application, and this doesn&apos;t
      change what you bring. I&apos;ve marked it as closed.
    </p>
  );
}

export function InterviewCard({ card, data }: { card: Extract<ChatCard, { type: "interview" }>; data: ChatData }) {
  const job = data.jobs.find((j) => j.id === card.jobId);
  const prep = data.preps[card.jobId];
  if (!job || !prep) return null;
  return (
    <div>
      <p>
        Here&apos;s calm prep for <strong>{job.title}</strong> at {job.company}. Read it once; every answer comes from
        something you&apos;ve already done.
      </p>
      <Box tint="mist">
        <p className="font-medium">Three things to carry in</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[14px]">
          {prep.focus.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ol>
      </Box>
      <Box>
        <p className="font-medium">Questions you&apos;ll likely hear</p>
        <ul className="mt-1 space-y-2 text-[14px]">
          {prep.questions.map((q) => (
            <li key={q.question}>
              <span className="font-medium">{q.question}</span>
              <span className="block text-muted">Answer from: {q.answerFrom}</span>
            </li>
          ))}
        </ul>
      </Box>
      <Box>
        <p className="font-medium">Questions you can ask them</p>
        <ul className="mt-1 list-disc pl-5 text-[14px]">
          {prep.askThem.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </Box>
    </div>
  );
}

export function PickerCard({
  card,
  data,
  jobIds,
  onPick,
}: {
  card: Extract<ChatCard, { type: "picker" }>;
  data: ChatData;
  jobIds: string[];
  onPick: (jobId: string) => void;
}) {
  const prompt = {
    apply: "Which job would you like to apply to?",
    ask: "Which job is your question about?",
    interview: "Which interview should we prepare for?",
    followup: "Which application would you like to follow up on?",
  }[card.purpose];
  const jobs = jobIds.map((id) => data.jobs.find((j) => j.id === id)).filter((j) => !!j);
  return (
    <div>
      <p>{jobs.length ? prompt : "There's nothing to pick from for that yet."}</p>
      {!card.done ? (
        <div className="mt-3 flex flex-col gap-1.5">
          {jobs.map((j) => (
            <button key={j.id} type="button" className={`${btnQuiet} justify-start text-left`} onClick={() => onPick(j.id)}>
              {j.title} · {j.company}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-[14px] text-sage">✓ {card.done}</p>
      )}
    </div>
  );
}
