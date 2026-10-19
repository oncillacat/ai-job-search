import type { Keyword } from "@/lib/data";

const groups = [
  { status: "covered", title: "Already in your CV", dot: "bg-sage" },
  { status: "added", title: "Reworded to match the posting", dot: "bg-mist-ink" },
  { status: "absent", title: "Honestly not there", dot: "bg-clay" },
] as const;

export function KeywordCoverage({ keywords }: { keywords: Keyword[] }) {
  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-3">
        {groups.map((g) => {
          const items = keywords.filter((k) => k.status === g.status);
          return (
            <div key={g.status}>
              <p className="mb-3 flex items-center gap-2 text-sm text-muted">
                <span aria-hidden className={`h-2 w-2 rounded-full ${g.dot}`} />
                {g.title} · {items.length}
              </p>
              <ul className="space-y-2">
                {items.map((k) => (
                  <li key={k.term}>
                    <span className="font-medium">{k.term}</span>
                    {k.note && <span className="block text-[14px] text-muted">{k.note}</span>}
                  </li>
                ))}
                {items.length === 0 && <li className="text-muted">None</li>}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-[15px] text-muted">
        You don&apos;t need 100%. Hiring teams expect some gaps, and we never add skills you don&apos;t have.
      </p>
    </div>
  );
}
