import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

// Pages here manage their own width so sections can run edge to edge.
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header>
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
          <BrandMark />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/start"
              className="whitespace-nowrap rounded-md bg-surface px-4 py-1.5 text-[15px] font-medium text-ink shadow-sm transition-opacity duration-300 hover:opacity-90"
            >
              Try the preview
            </Link>
          </div>
        </div>
      </header>
      <main className="w-full flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
