"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { MobileHeader } from "./mobile-header";
import { useThreads } from "@/hooks/use-threads";

export function AppShell({ children }: { children: ReactNode }) {
  const { threads, activeThreadId, selectThread, newChat } = useThreads();

  return (
    <div className="flex h-screen flex-col">
      <MobileHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={selectThread}
          onNewChat={newChat}
        />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
