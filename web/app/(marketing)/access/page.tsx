import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Access · AI Job Search" };

// The passcode page shown on the shared site until real sign-in exists.
export default function AccessPage({ searchParams }: PageProps<"/access">) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <PageHeader eyebrow="Private preview" title="Enter your access code.">
        This preview uses real Claude, so it&apos;s open only to people who have the code. If you were given one, enter
        it below.
      </PageHeader>
      <Suspense>
        <AccessForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AccessForm({ searchParams }: { searchParams: PageProps<"/access">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/chat";
  const error = params.error === "1";
  return (
    <form method="post" action="/api/access" className="max-w-md space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block font-medium">
        Access code
        <input
          type="password"
          name="code"
          required
          autoFocus
          autoComplete="off"
          className="mt-1 block w-full border border-line bg-surface px-3 py-2 text-[16px] font-normal"
        />
      </label>
      {error && (
        <p role="alert" className="text-[15px] text-clay">
          That code didn&apos;t match. Check it and try again.
        </p>
      )}
      <button type="submit" className="bg-sage px-4 py-2 text-[15px] font-medium text-sage-ink hover:opacity-90">
        Continue
      </button>
    </form>
  );
}
