import type { Metadata } from "next";
import { ButtonLink, Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Mac app · AI Job Search",
  description: "The AI Job Search app for your own computer.",
};

// The Mac and Windows apps aren't published for download at the moment. This page stays so
// older links don't end in an error.
export default function DownloadPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <PageHeader eyebrow="Desktop app" title="Not available for download right now.">
        The desktop app, which searches the job sites (LinkedIn included) from your own computer, isn&apos;t
        published at the moment.
      </PageHeader>
      <Card className="space-y-3">
        <p>
          You can still use AI Job Search here in your browser. With an access code, Claude reads your CV, searches
          Job Bank and prepares tailored applications.
        </p>
        <ButtonLink href="/chat">Go to the chat</ButtonLink>
      </Card>
    </div>
  );
}
