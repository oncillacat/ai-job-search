import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ButtonLink, Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Download for Mac · AI Job Search",
  description:
    "The AI Job Search app for Mac: searches, LinkedIn included, run from your own computer.",
};

// The Mac app is published as a GitHub release (too large for the site itself).
const VERSION = "0.1.0";
const DMG =
  "https://github.com/oncillacat/ai-job-search/releases/download/mac-app-v0.1.0/AI-Job-Search-0.1.0-arm64.dmg";
const RELEASE =
  "https://github.com/oncillacat/ai-job-search/releases/tag/mac-app-v0.1.0";
const SHA256 =
  "8399e92884aa67fcf12a840676b126acb10c5e83bdc1f58a1aa755fe29d723e3";

export default function DownloadPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <PageHeader eyebrow="Mac app" title="AI Job Search on your Mac.">
        The app runs on your own computer, so job searches, LinkedIn included,
        come from your home internet. Claude reads your CV and tailors your
        applications through this site with your access code, or with your own
        Anthropic API key.
      </PageHeader>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href={DMG}>Download for Mac (75 MB)</ButtonLink>
          <span className="text-[15px] text-muted">
            Version {VERSION} · Apple Silicon (M1 or later) · macOS 12 or newer
          </span>
        </div>
        <p className="text-[14px] text-muted">
          Not sure which Mac you have? Apple menu → About This Mac: &ldquo;Chip:
          Apple M…&rdquo; means it will work. Intel Macs aren&apos;t supported
          yet.
        </p>
      </Card>

      <h2 className="mb-4 mt-12 font-display text-2xl">How to install</h2>
      <ol className="space-y-4">
        <Step n={1} title="Open the download">
          Double-click <strong>AI-Job-Search-{VERSION}-arm64.dmg</strong> in
          your Downloads folder. A window opens.
        </Step>
        <Step n={2} title="Drag the app into Applications">
          Drag <strong>AI Job Search</strong> onto the{" "}
          <strong>Applications</strong> folder in that window, then eject the
          disk image (the ⏏ next to it in Finder).
        </Step>
        <Step n={3} title="Open it the first time">
          Open AI Job Search from Applications. macOS will say it can&apos;t
          check the app, because it isn&apos;t from the App Store or signed by a
          registered developer. Click <strong>Done</strong>, then open{" "}
          <strong>System Settings → Privacy &amp; Security</strong>, scroll
          down, and click <strong>Open Anyway</strong> next to AI Job Search.
          Confirm with your password. You only do this once.
        </Step>
        <Step n={4} title="Enter your access code, or your own API key">
          The app asks how to use Claude. Choose{" "}
          <strong>Enter access code</strong> and type the code you were given,
          or choose <strong>Use my API key</strong> if you have an Anthropic API
          key (it starts with sk-ant-). It&apos;s saved in your Mac&apos;s
          Keychain. You can change it later in the app under{" "}
          <strong>Settings → Keys and access</strong>.
        </Step>
        <Step n={5} title="Use it in your browser">
          The app opens in your web browser. A small{" "}
          <strong>AI Job Search is running</strong> window stays open: click{" "}
          <strong>Open in browser</strong> to get back to it, or{" "}
          <strong>Quit</strong> when you&apos;re done. Next time, just open the
          app from Applications.
        </Step>
      </ol>

      <h2 className="mb-4 mt-12 font-display text-2xl">Good to know</h2>
      <ul className="list-disc space-y-2 pl-5 text-[16px]">
        <li>
          <strong>Your files stay on your Mac.</strong> Your CV, profile and the
          documents written for you are kept in your browser on this computer.
          Your CV is sent to Claude to be read, and job postings to be rated.
        </li>
        <li>
          <strong>Only your computer can use it.</strong> The app answers only
          on this Mac, not to others on the same Wi-Fi.
        </li>
        <li>
          <strong>If a key stops working,</strong> the chat asks for a new one
          and tries again.
        </li>
        <li>
          <strong>Something not working?</strong> Quit the app and open it
          again. Details are written to{" "}
          <code className="text-[14px]">~/Library/Logs/AI Job Search.log</code>.
        </li>
        <li>
          <strong>To remove it,</strong> drag AI Job Search from Applications to
          the Bin. Your saved key or code stays in Keychain Access under
          &ldquo;AI Job Search&rdquo;; delete it there if you like.
        </li>
      </ul>

      <details className="mt-10 text-[14px] text-muted">
        <summary className="cursor-pointer">
          Check the download (optional)
        </summary>
        <p className="mt-2">
          SHA-256: <code className="break-all">{SHA256}</code>
        </p>
        <p className="mt-1">
          In Terminal:{" "}
          <code>
            shasum -a 256 ~/Downloads/AI-Job-Search-{VERSION}-arm64.dmg
          </code>{" "}
          should print the same. Release notes on{" "}
          <a href={RELEASE} className="underline underline-offset-4">
            GitHub
          </a>
          .
        </p>
      </details>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3">
      <span className="flex h-9 w-9 items-center justify-center bg-mist-soft font-display text-lg text-mist-ink">
        {n}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-[16px] text-muted">{children}</p>
      </div>
    </li>
  );
}
