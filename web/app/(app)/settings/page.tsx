import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "@/components/settings-form";
import { KeysPanel } from "@/components/keys-panel";

export const metadata: Metadata = { title: "Settings · AI Job Search" };

export default function SettingsPage() {
  return (
    <div>
      <PageHeader eyebrow="Settings" title="Set the pace that suits you.">
        The search works in the background. You choose how often it speaks up.
      </PageHeader>
      <div className="space-y-8">
        {/* Only the app on someone's own computer has keys to manage. */}
        {!process.env.VERCEL && <KeysPanel />}
        <SettingsForm />
      </div>
    </div>
  );
}
