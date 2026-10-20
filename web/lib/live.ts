// Whether this server can talk to Claude: a key is set, and it isn't the public Vercel demo
// (where live features stay off until sign-in exists). Server-only.
export function liveAvailable() {
  const key = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  const publicDemo = !!process.env.VERCEL && !process.env.ALLOW_PUBLIC_CHAT;
  return key && !publicDemo;
}
