import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ProfileEditor } from "@/components/profile-form";
import { getProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Profile · AI Job Search" };

export default async function ProfilePage() {
  const profile = await getProfile();
  return (
    <div>
      <PageHeader eyebrow="Your master profile" title="The one version of you.">
        Every match and every tailored CV starts here. Correct it once and you won&apos;t have to
        rewrite your history for each job.
      </PageHeader>
      <ProfileEditor sample={profile} />
    </div>
  );
}
