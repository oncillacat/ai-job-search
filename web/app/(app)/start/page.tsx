import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { UploadFlow } from "@/components/upload-flow";
import { getProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Start · AI Job Search" };

export default async function StartPage() {
  const profile = await getProfile();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Step 1 of 1" title="Start with your CV, just once.">
        We read it and build a profile. Everything after this, from matching to tailoring,
        comes from that profile, so you never re-enter your history.
      </PageHeader>
      <UploadFlow sample={profile} />
    </div>
  );
}
