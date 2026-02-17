"use client";

import { createContext, useState, useCallback, type ReactNode } from "react";

export type SidebarContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

export const SidebarContext = createContext<SidebarContextType>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}
