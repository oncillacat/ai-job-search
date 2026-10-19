"use client";

// In-memory UI state for the assistant panel (not saved): whether it's open,
// and a question waiting to be sent when it opens.
import { useSyncExternalStore } from "react";
import { demoActions } from "./demo-store";

interface AssistantUi {
  open: boolean;
}

export interface AssistantRequest {
  text: string;
  send: boolean;
}

let ui: AssistantUi = { open: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const closed: AssistantUi = { open: false };
let requestHandler: ((r: AssistantRequest) => void) | null = null;

/** The panel registers here to receive questions sent from buttons elsewhere on the page. */
export function onAssistantRequest(handler: (r: AssistantRequest) => void) {
  requestHandler = handler;
  return () => {
    if (requestHandler === handler) requestHandler = null;
  };
}

export function openAssistant(opts: { attach?: string; prompt?: string; send?: boolean } = {}) {
  if (opts.attach) demoActions.attachJob(opts.attach);
  ui = { open: true };
  emit();
  if (opts.prompt) requestHandler?.({ text: opts.prompt, send: !!opts.send });
}

export function closeAssistant() {
  ui = { open: false };
  emit();
}

export function useAssistantUi() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => ui,
    () => closed,
  );
}
