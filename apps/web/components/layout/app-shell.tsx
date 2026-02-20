"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { MobileHeader } from "./mobile-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <MobileHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
