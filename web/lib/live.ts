import { liveConfigured } from "./access";

// Whether this deployment runs the Claude features (locally with a key; on Vercel only behind the
// passcode or when opened on purpose). Pages use it to drop the sample person. Server-only.
export function liveAvailable() {
  return liveConfigured();
}
