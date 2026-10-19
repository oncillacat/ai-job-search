"use client";

// Per-browser demo state: decisions on jobs, profile edits and preferences.
// It lives in localStorage only, never on a server. When the Supabase backend
// arrives, these actions become Server Actions backed by the user_jobs,
// profiles and preferences tables.

import type { LiveSearch } from "@/lib/search/types";
import { useSyncExternalStore } from "react";
import { getDefaultPreferences, type Preferences, type Profile } from "@/lib/data";

export type Decision = "saved" | "applied" | "let-go" | "interview" | "offer" | "rejected";

export interface JobDecision {
  decision: Decision;
  reason?: string;
  at: string;
  /** When the person sent (or marked) a follow-up for this application */
  followedUpAt?: string;
}

/** One entry in the chat-first demo thread. Cards reference sample data by id. */
export type ChatCard =
  | { type: "intro" }
  | { type: "upload"; files?: Record<string, string | "skipped">; done?: boolean }
  | {
      type: "guesses";
      done?: boolean;
      roles?: string;
      cities?: string;
      salary?: string;
      /** Reasons Claude gave after reading the CV; absent for the sample profile */
      reasons?: { roles: string; cities: string; salary: string };
    }
  | { type: "blocker"; done?: boolean }
  | {
      type: "search";
      round: number;
      encourage?: { searched: number; applied: number };
      byClaude?: boolean;
      /** Real results from the live search (local only); absent for the sample rounds */
      live?: LiveSearch;
    }
  | { type: "picker"; purpose: "apply" | "ask" | "interview" | "followup"; done?: string }
  | { type: "apply"; jobId: string; submitted?: boolean }
  | { type: "answer"; jobId: string; question: string }
  | { type: "checkIn"; jobId: string; done?: string }
  | { type: "followUpEmail"; jobId: string; done?: boolean }
  | { type: "kind"; jobId: string }
  | { type: "interview"; jobId: string }
  | { type: "note" };

export interface ChatItem {
  id: string;
  from: "claude" | "you";
  text?: string;
  card?: ChatCard;
}

export interface ChatThread {
  items: ChatItem[];
  /** Job the next free-text question is about */
  focusJob: string | null;
  /** "prepare" = still prepare applications that have a hard blocker (default) */
  blockerPref: "prepare" | "skip";
  /** Times (ISO) of every search, for the encouragement trigger */
  searches: string[];
  /** Applications Claude has already checked in about */
  checkedIn: string[];
  /** Live posting ids already shown, so repeat searches return only new jobs */
  seenJobs: string[];
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
  /** The chat-first demo conversation */
  chat: ChatThread;
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
  chat: { items: [], focusJob: null, blockerPref: "prepare", searches: [], checkedIn: [], seenJobs: [] },
};

let state: DemoState | null = null;
const listeners = new Set<() => void>();

function load(): DemoState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<DemoState>) : {};
    state = {
      ...initialState,
      ...saved,
      assistant: saved.assistant ?? initialState.assistant,
      chat: { ...initialState.chat, ...(saved.chat ?? {}) },
    };
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
  followedUp(jobId: string) {
    set((s) => {
      const d = s.decisions[jobId];
      const base = d ?? { decision: "applied" as Decision, at: new Date().toISOString() };
      return { ...s, decisions: { ...s.decisions, [jobId]: { ...base, followedUpAt: new Date().toISOString() } } };
    });
  },
  /** Adds items to the chat and returns their ids. */
  chatAdd(...items: Omit<ChatItem, "id">[]): string[] {
    const base = load().chat.items.length;
    const withIds = items.map((it, i) => ({ ...it, id: `${Date.now().toString(36)}-${base + i}` }));
    set((s) => ({ ...s, chat: { ...s.chat, items: [...s.chat.items, ...withIds] } }));
    return withIds.map((it) => it.id);
  },
  chatSetText(itemId: string, text: string) {
    set((s) => ({
      ...s,
      chat: { ...s.chat, items: s.chat.items.map((it) => (it.id === itemId ? { ...it, text } : it)) },
    }));
  },
  chatUpdateCard(itemId: string, patch: Partial<ChatCard>) {
    set((s) => ({
      ...s,
      chat: {
        ...s.chat,
        items: s.chat.items.map((it) =>
          it.id === itemId && it.card ? { ...it, card: { ...it.card, ...patch } as ChatCard } : it,
        ),
      },
    }));
  },
  chatRemove(itemId: string) {
    set((s) => ({ ...s, chat: { ...s.chat, items: s.chat.items.filter((i) => i.id !== itemId) } }));
  },
  chatSet(patch: Partial<ChatThread>) {
    set((s) => ({ ...s, chat: { ...s.chat, ...patch } }));
  },
  chatRestart() {
    set((s) => ({ ...s, chat: initialState.chat }));
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
