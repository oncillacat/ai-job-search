"use client";

// Per-browser demo state: decisions on jobs, profile edits and preferences.
// It lives in localStorage only, never on a server. When the Supabase backend
// arrives, these actions become Server Actions backed by the user_jobs,
// profiles and preferences tables.

import { useSyncExternalStore } from "react";
import { getDefaultPreferences, type Preferences, type Profile } from "@/lib/data";

export type Decision = "saved" | "applied" | "let-go";

export interface JobDecision {
  decision: Decision;
  reason?: string;
  at: string;
}

export interface ChatMessage {
  role: "you" | "helper";
  text: string;
  /** For helper replies: what the draft was based on, and what to check */
  basis?: string;
  check?: string;
}

export interface DemoState {
  decisions: Record<string, JobDecision>;
  preferences: Preferences;
  profile: Profile | null;
  cvUploaded: boolean;
  readyMarked: Record<string, boolean>;
  /** Board postings the person has looked at */
  seen: Record<string, boolean>;
  /** The assistant conversation and the jobs attached to it */
  assistant: { messages: ChatMessage[]; attached: string[] };
}

const KEY = "ajs-demo-state";

const initialState: DemoState = {
  decisions: {},
  preferences: getDefaultPreferences(),
  profile: null,
  cvUploaded: false,
  readyMarked: {},
  seen: {},
  assistant: { messages: [], attached: [] },
};

let state: DemoState | null = null;
const listeners = new Set<() => void>();

function load(): DemoState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<DemoState>) : {};
    state = { ...initialState, ...saved, assistant: saved.assistant ?? initialState.assistant };
  } catch {
    state = initialState;
  }
  return state;
}

function set(update: (s: DemoState) => DemoState) {
  state = update(load());
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode); the demo still works in memory.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab (for example the demo employer site) changed the saved state: reload it here.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const demoActions = {
  decide(jobId: string, decision: Decision, reason?: string) {
    set((s) => ({
      ...s,
      decisions: { ...s.decisions, [jobId]: { decision, reason, at: new Date().toISOString() } },
    }));
  },
  undo(jobId: string) {
    set((s) => {
      const decisions = { ...s.decisions };
      delete decisions[jobId];
      return { ...s, decisions };
    });
  },
  setPreferences(preferences: Preferences) {
    set((s) => ({ ...s, preferences }));
  },
  setProfile(profile: Profile) {
    set((s) => ({ ...s, profile }));
  },
  clearProfile() {
    set((s) => ({ ...s, profile: null }));
  },
  markCvUploaded() {
    set((s) => ({ ...s, cvUploaded: true }));
  },
  markReady(jobId: string) {
    set((s) => ({ ...s, readyMarked: { ...s.readyMarked, [jobId]: true } }));
  },
  toggleSeen(postingId: string) {
    set((s) => ({ ...s, seen: { ...s.seen, [postingId]: !s.seen[postingId] } }));
  },
  addMessages(...messages: ChatMessage[]) {
    set((s) => ({ ...s, assistant: { ...s.assistant, messages: [...s.assistant.messages, ...messages] } }));
  },
  attachJob(jobId: string) {
    set((s) =>
      s.assistant.attached.includes(jobId)
        ? s
        : { ...s, assistant: { ...s.assistant, attached: [...s.assistant.attached, jobId] } },
    );
  },
  detachJob(jobId: string) {
    set((s) => ({ ...s, assistant: { ...s.assistant, attached: s.assistant.attached.filter((j) => j !== jobId) } }));
  },
  clearConversation() {
    set((s) => ({ ...s, assistant: { messages: [], attached: s.assistant.attached } }));
  },
  reset() {
    set(() => initialState);
  },
};

/** The current state, read outside React (for example inside an event handler that just changed it). */
export function getDemoState(): DemoState {
  return load();
}

export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, load, () => initialState);
}
