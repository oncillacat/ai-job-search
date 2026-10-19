import type { ReactNode } from "react";
import type { ScrapeRun } from "@/lib/data";

// Dashboard building blocks shared by the server page (sample data) and the live view (browser data).

export function Panel({ title, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-line bg-surface p-5 ${className}`}>
      <h3 className="mb-3 text-[13px] font-medium tracking-wide text-muted">{title}</h3>
      {children}
    </div>
  );
}

/** One stacked bar with a legend of colour squares, labels and counts. Each segment has a hover tooltip. */
export function StackedBar({ label, rows }: { label: string; rows: { label: string; count: number; color: string }[] }) {
  const total = rows.reduce((n, r) => n + r.count, 0);
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
  return (
    <figure>
      <figcaption className="sr-only">
        {label}: {rows.map((r) => `${r.label} ${r.count}`).join(", ")}
      </figcaption>
      <p aria-hidden className="mb-2 text-[13px] font-medium">
        {label}
      </p>
      <div aria-hidden className="flex h-2.5 gap-0.5">
        {rows.map((r) =>
          r.count > 0 ? (
            <span
              key={r.label}
              title={`${r.label}: ${r.count} (${pct(r.count)})`}
              className={`block h-full min-w-[3px] ${r.color} transition-opacity duration-200 hover:opacity-80`}
              style={{ flexGrow: r.count, flexBasis: 0 }}
            />
          ) : null,
        )}
      </div>
      <ul aria-hidden className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 shrink-0 ${r.color}`} />
            {r.label} <span className="tabular-nums text-ink">{r.count}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Single-series bar chart; each bar has a hover tooltip and the latest value is labelled. */
export function RunsChart({ runs }: { runs: ScrapeRun[] }) {
  const W = 640;
  const H = 220;
  const L = 34;
  const R = 8;
  const T = 20;
  const B = 28;
  const max = Math.max(20, Math.ceil(Math.max(...runs.map((r) => r.count)) / 20) * 20);
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  const iw = W - L - R;
  const ih = H - T - B;
  const step = iw / runs.length;
  const bw = Math.min(step - 6, 36);
  const y = (v: number) => T + ih - (v / max) * ih;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-labelledby="runs-desc">
        <desc id="runs-desc">
          New postings per day from {runs[0].date} to {runs[runs.length - 1].date}, between{" "}
          {Math.min(...runs.map((r) => r.count))} and {Math.max(...runs.map((r) => r.count))} a day.
        </desc>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">
              {t}
            </text>
          </g>
        ))}
        {runs.map((r, i) => {
          const x = L + i * step + (step - bw) / 2;
          const last = i === runs.length - 1;
          return (
            <g key={r.date} className="group">
              <title>{`${r.date}: ${r.count} new postings`}</title>
              {/* Generous hit area so the tooltip is easy to reach */}
              <rect x={L + i * step} y={T} width={step} height={ih} fill="transparent" />
              <path
                d={`M${x},${T + ih} V${y(r.count) + 4} a4,4 0 0 1 4,-4 H${x + bw - 4} a4,4 0 0 1 4,4 V${T + ih} Z`}
                fill={last ? "var(--sage)" : "var(--mist)"}
                className="transition-opacity duration-200 group-hover:opacity-80"
              />
              {last && (
                <text x={x + bw / 2} y={y(r.count) - 6} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--ink)">
                  {r.count}
                </text>
              )}
              <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
                {r.date.replace("Oct ", "10/")}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-sage" /> Today
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-mist" /> Earlier days
        </span>
      </figcaption>
      <table className="sr-only">
        <caption>New postings per day</caption>
        <tbody>
          {runs.map((r) => (
            <tr key={r.date}>
              <th scope="row">{r.date}</th>
              <td>{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
