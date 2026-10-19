"use client";

import Link from "next/link";
import { useState } from "react";
import { demoActions, useDemoState } from "@/lib/state/demo-store";
import type { BoardPosting, Fit } from "@/lib/data";

const fitPill: Record<Fit, { label: string; cls: string }> = {
  high: { label: "High", cls: "bg-sage-soft text-sage" },
  medium: { label: "Medium", cls: "bg-mist-soft text-mist-ink" },
  low: { label: "Low", cls: "bg-surface-2 text-muted" },
};

function FitPill({ fit }: { fit: Fit }) {
  const f = fitPill[fit];
  return <span className={`whitespace-nowrap rounded-md px-2.5 py-0.5 text-[12px] font-medium ${f.cls}`}>{f.label}</span>;
}

function Title({ p }: { p: BoardPosting }) {
  return p.jobId ? (
    <Link href={`/jobs/${p.jobId}`} className="font-medium text-ink underline-offset-4 hover:text-sage hover:underline">
      {p.title}
    </Link>
  ) : (
    <span className="font-medium">{p.title}</span>
  );
}

const th = "px-3 py-2.5 text-left text-[12px] font-medium tracking-wide text-muted";
const td = "border-t border-line px-3 py-2.5 align-top";

export function BacklogTable({ rows }: { rows: BoardPosting[] }) {
  const { seen } = useDemoState();
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[720px] border-collapse text-[14px]">
        <thead>
          <tr>
            <th className={th}>First seen</th>
            <th className={th}>Role</th>
            <th className={th}>Organisation</th>
            <th className={th}>Source</th>
            <th className={th}>Posted</th>
            <th className={th}>Looked at</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const done = !!seen[r.id];
            return (
              <tr key={r.id} className={`transition-opacity duration-300 ${done ? "opacity-45" : ""}`}>
                <td className={`${td} whitespace-nowrap tabular-nums text-muted`}>{r.firstSeen}</td>
                <td className={td}>
                  <Title p={r} />
                  {r.deadline && (
                    <span className="ml-2 whitespace-nowrap rounded-md border border-line px-2 py-0.5 text-[12px] text-muted">
                      Closes {r.deadline}
                    </span>
                  )}
                  <span className="block text-[13px] text-muted">{r.location}</span>
                </td>
                <td className={td}>{r.company}</td>
                <td className={`${td} text-muted`}>{r.source}</td>
                <td className={`${td} whitespace-nowrap tabular-nums text-muted`}>{r.posted}</td>
                <td className={td}>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-muted">
                    <input
                      type="checkbox"
                      id={`seen-${r.id}`}
                      checked={done}
                      onChange={() => demoActions.toggleSeen(r.id)}
                      className="h-4 w-4 accent-[var(--sage)]"
                    />
                    Seen
                  </label>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type FitFilter = "all" | Fit;

export function TodayTable({ rows, total }: { rows: BoardPosting[]; total: number }) {
  const [fit, setFit] = useState<FitFilter>("all");
  const [source, setSource] = useState("all");
  const [q, setQ] = useState("");
  const sources = [...new Set(rows.map((r) => r.source))];
  const needle = q.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (fit === "all" || r.fit === fit) &&
      (source === "all" || r.source === source) &&
      (!needle || `${r.title} ${r.company} ${r.location}`.toLowerCase().includes(needle)),
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Segmented
          label="Filter by match"
          value={fit}
          onChange={setFit}
          options={[
            ["all", "All"],
            ["high", "High"],
            ["medium", "Medium"],
            ["low", "Low"],
          ]}
        />
        <Segmented
          label="Filter by source"
          value={source}
          onChange={setSource}
          options={[["all", "All sources"], ...sources.map((s) => [s, s] as [string, string])]}
        />
        <input
          type="search"
          id="today-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search role, organisation, city"
          aria-label="Search today's postings"
          className="min-w-0 max-w-xs flex-1 basis-48 rounded-md border border-line bg-surface px-4 py-1.5 text-[14px] focus:border-sage focus:outline-none"
        />
        <span className="text-[13px] tabular-nums text-muted" aria-live="polite">
          {shown.length} shown · sample of {total}
        </span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[760px] border-collapse text-[14px]">
          <thead>
            <tr>
              <th className={th}>Match</th>
              <th className={th}>Role</th>
              <th className={th}>Organisation</th>
              <th className={th}>Location</th>
              <th className={th}>Source</th>
              <th className={th}>Posted</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id}>
                <td className={td}>
                  <FitPill fit={r.fit} />
                </td>
                <td className={td}>
                  <Title p={r} />
                  {r.note && <span className="mt-0.5 block text-[13px] text-muted">{r.note}</span>}
                </td>
                <td className={td}>{r.company}</td>
                <td className={`${td} text-muted`}>{r.location}</td>
                <td className={`${td} text-muted`}>{r.source}</td>
                <td className={`${td} whitespace-nowrap tabular-nums text-muted`}>{r.posted}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="p-6 text-center text-muted">No postings match these filters.</p>}
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-md bg-surface-2 p-1">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`rounded-md px-3 py-1 text-[13px] transition-colors duration-300 ${
            value === v ? "bg-surface font-medium text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
