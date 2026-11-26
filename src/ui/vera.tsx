"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { VeraSheet } from "./components/VeraSheet";

const VeraContext = createContext<{ openVera: () => void } | null>(null);

/** One Vera sheet for the whole mini app: the tab bar and the home card both open it. */
export function VeraProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ openVera: () => setOpen(true) }), []);
  return (
    <VeraContext.Provider value={value}>
      {children}
      <VeraSheet open={open} onClose={() => setOpen(false)} />
    </VeraContext.Provider>
  );
}

export function useVera() {
  const vera = useContext(VeraContext);
  if (!vera) throw new Error("useVera must be used inside <VeraProvider>");
  return vera;
}
