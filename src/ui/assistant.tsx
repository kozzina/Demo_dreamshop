"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { AssistantSheet } from "./components/AssistantSheet";

const AssistantContext = createContext<{ openAssistant: () => void } | null>(null);

/** One Sonya sheet for the whole mini app: the tab bar and the home card both open it. */
export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ openAssistant: () => setOpen(true) }), []);
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
