"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AssistantSheet } from "./components/AssistantSheet";
import { listenForHoodSwitch } from "./hood";

const AssistantContext = createContext<{ openAssistant: () => void } | null>(null);

/** One Sonya sheet for the whole mini app: the tab bar and the home card both open it. */
export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ openAssistant: () => setOpen(true) }), []);
  // Embedded in the case page, the page's «Показать, как работает» switch reaches the chat.
  useEffect(listenForHoodSwitch, []);
  return (
    <AssistantContext.Provider value={value}>
      {children}
      <AssistantSheet open={open} onClose={() => setOpen(false)} />
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const assistant = useContext(AssistantContext);
  if (!assistant) throw new Error("useAssistant must be used inside <AssistantProvider>");
  return assistant;
}
