import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-display text-3xl">Nothing here, and that&apos;s fine.</p>
      <p className="mt-3 text-muted">This page doesn&apos;t exist. Today&apos;s list is where you left it.</p>
      <ButtonLink href="/digest" className="mt-8">
        Back to today
      </ButtonLink>
    </main>
  );
}
