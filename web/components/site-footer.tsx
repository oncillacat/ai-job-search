import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-mist-soft">
      <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
        <p>Preview with sample data. Nothing you do here leaves your browser.</p>
        <p className="flex gap-4">
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <a
            href="https://github.com/MadsLorentzen/ai-job-search"
            className="hover:text-ink"
            rel="noopener noreferrer"
          >
            Built on MadsLorentzen/ai-job-search (MIT)
          </a>
        </p>
      </div>
    </footer>
  );
}
