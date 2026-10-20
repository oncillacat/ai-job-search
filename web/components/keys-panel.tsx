"use client";

import { useEffect, useState } from "react";
import { deleteKey, localKeys, saveKey, type KeyName, type KeyStatus } from "@/lib/state/keys";
import { Button, Card } from "./ui";

// Settings → Keys and access, in the app on this computer only. Keys are saved in the macOS
// Keychain; this page never shows a saved key, only that it's set and its last 4 characters.

const FIELDS: { name: KeyName; label: string; hint: string }[] = [
  {
    name: "ANTHROPIC_API_KEY",
    label: "Your Anthropic API key",
    hint: "Starts with sk-ant-. Claude then runs on your own account. From console.anthropic.com → API keys.",
  },
  {
    name: "REMOTE_ACCESS_CODE",
    label: "Access code for the shared site",
    hint: "Instead of your own key: use Claude through the shared site with the code you were given.",
  },
  { name: "ADZUNA_APP_ID", label: "Adzuna app ID (optional)", hint: "More job postings. Free at developer.adzuna.com." },
  { name: "ADZUNA_APP_KEY", label: "Adzuna app key (optional)", hint: "Goes with the app ID above." },
  { name: "JOOBLE_API_KEY", label: "Jooble API key (optional)", hint: "More job postings. Free from jooble.org/api/about." },
];

export function KeysPanel() {
  const [status, setStatus] = useState<KeyStatus | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const refresh = () =>
    void localKeys().then((r) => {
      if (r) setStatus(r.keys);
      else setUnavailable(true);
    });
  useEffect(refresh, []);

  if (unavailable) return null;
  return (
    <Card className="space-y-5" id="keys">
      <div>
        <h2 className="font-display text-xl">Keys and access</h2>
        <p className="mt-1 text-muted">
          Saved in your Mac&apos;s Keychain, not in a file. Your own API key stays on this Mac; the access code is only
          sent to the shared site to sign in. You need one of the two; your own key is used when both are set.
        </p>
      </div>
      {!status ? (
        <p className="text-muted">Reading your keys…</p>
      ) : (
        <div className="space-y-5">
          {FIELDS.map((f) => (
            <KeyField key={f.name} field={f} state={status[f.name]} onChange={refresh} />
          ))}
        </div>
      )}
    </Card>
  );
}

function KeyField({
  field,
  state,
  onChange,
}: {
  field: (typeof FIELDS)[number];
  state: { set: boolean; hint?: string };
  onChange: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaving(true);
        void saveKey(field.name, value).then((err) => {
          setSaving(false);
          setError(err);
          if (!err) {
            setValue("");
            onChange();
          }
        });
      }}
    >
      <label className="block font-medium">
        {field.label}
        <span className="ml-2 text-[13px] font-normal text-muted">
          {state.set ? `Saved (${state.hint})` : "Not set"}
        </span>
        <span className="mt-1 flex flex-wrap gap-2">
          <input
            type="password"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={state.set ? "Paste a new one to replace it" : "Paste it here"}
            className="min-w-0 flex-1 border border-line bg-surface px-3 py-2 text-[15px] font-normal"
          />
          <Button type="submit" disabled={!value.trim() || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          {state.set && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => void deleteKey(field.name).then(onChange)}
            >
              Remove
            </Button>
          )}
        </span>
      </label>
      <p className="mt-1 text-[13px] text-muted">{field.hint}</p>
      {error && <p className="mt-1 text-[14px] text-clay">{error}</p>}
    </form>
  );
}
