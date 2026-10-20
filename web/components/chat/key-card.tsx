"use client";

import { useEffect, useState } from "react";
import type { ChatCard } from "@/lib/state/demo-store";
import { deleteKey, localKeys, saveKey, type KeyName } from "@/lib/state/keys";
import { btnPrimary } from "./chat-cards";

// Shown in the app on this computer when a saved API key or access code was rejected: asks for a
// new one, saves it in the Keychain, and lets the chat retry.

export function KeyNeededCard({
  card,
  onSaved,
}: {
  card: Extract<ChatCard, { type: "keyNeeded" }>;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<KeyName>("ANTHROPIC_API_KEY");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Ask for whichever this app was using: its own key, or the shared site's access code.
  useEffect(() => {
    void localKeys().then((r) => {
      if (r && !r.keys.ANTHROPIC_API_KEY.set && r.keys.REMOTE_ACCESS_CODE.set) setMode("REMOTE_ACCESS_CODE");
    });
  }, []);

  if (card.done) return <p className="text-[15px] text-sage">✓ Saved. Trying again.</p>;

  const isCode = mode === "REMOTE_ACCESS_CODE";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaving(true);
        // Your own key is used when both are set, so a rejected one must go when switching to a code.
        const clear = isCode ? deleteKey("ANTHROPIC_API_KEY") : Promise.resolve();
        void clear.then(() => saveKey(mode, value)).then((err) => {
          setSaving(false);
          setError(err);
          if (!err) onSaved();
        });
      }}
    >
      <p>
        {isCode
          ? "The access code for the shared site didn't work. It may have changed. Enter the current one:"
          : "Your Anthropic API key was rejected. It may have expired or been removed. Paste a new one:"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="password"
          autoComplete="off"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={isCode ? "Access code" : "Anthropic API key"}
          placeholder={isCode ? "Access code" : "sk-ant-…"}
          className="min-w-0 flex-1 border border-line bg-surface px-3 py-2 text-[15px]"
        />
        <button type="submit" className={btnPrimary} disabled={!value.trim() || saving}>
          {saving ? "Saving…" : "Save and try again"}
        </button>
      </div>
      {error && <p className="mt-2 text-[14px] text-clay">{error}</p>}
      <p className="mt-2 text-[13px] text-muted">
        Saved in your Mac&apos;s Keychain.{" "}
        <button
          type="button"
          className="underline underline-offset-4"
          onClick={() => setMode(isCode ? "ANTHROPIC_API_KEY" : "REMOTE_ACCESS_CODE")}
        >
          {isCode ? "Use my own API key instead" : "Use an access code instead"}
        </button>
        {" · "}
        <a href="/settings#keys" className="underline underline-offset-4">
          All keys in Settings
        </a>
      </p>
    </form>
  );
}
