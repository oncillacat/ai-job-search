import Link from "next/link";

/** The name plus a small mark: three dots, one picked. Mirrors "a few picks out of many". */
export function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap font-display text-lg text-ink">
      <span aria-hidden className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-mist-ink/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-sage" />
        <span className="h-1.5 w-1.5 rounded-full bg-mist-ink/40" />
      </span>
      AI Job Search
    </Link>
  );
}
