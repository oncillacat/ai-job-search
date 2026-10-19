import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Privacy · AI Job Search" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 [&>*]:max-w-prose">
      <PageHeader eyebrow="Privacy" title="Your CV is yours.">
        This is a preview of the site. It runs entirely in your browser with sample data.
      </PageHeader>
      <div className="space-y-6 text-[17px]">
        <section>
          <h2 className="mb-2 font-display text-xl">In this preview</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>No account and no database.</li>
            <li>
              When the assistant is connected, your question, your profile and any jobs you attach are sent to
              Anthropic&apos;s Claude API to write the answer. This site&apos;s server passes them through and keeps
              nothing.
            </li>
            <li>
              Your CV and other files, the profile Claude reads from your CV, and the drafts written for you
              (form answers, follow-up emails) are kept in this browser&apos;s private storage on your computer.
              You can download or delete them any time in Settings.
            </li>
            <li>
              When Claude is connected, your CV is sent once to Anthropic&apos;s Claude API to be read. This
              site&apos;s server passes it through and keeps no copy.
            </li>
            <li>
              Your choices (saved and skipped jobs, settings) are kept in this browser&apos;s local storage.
              Clearing site data, or &ldquo;Restart the demo&rdquo; in the chat, removes everything.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-display text-xl">When accounts arrive</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>You&apos;ll be asked for consent before any CV is uploaded.</li>
            <li>You&apos;ll be able to download all your data, or delete your account and everything in it.</li>
            <li>Uploaded files will be deleted automatically after a set period.</li>
            <li>Your data will never be used to train AI models.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
