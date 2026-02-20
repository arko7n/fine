"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { MobileHeader } from "./mobile-header";
import { useSessions } from "@/hooks/use-sessions";

export function AppShell({ children }: { children: ReactNode }) {
  const { sessions, activeSessionId, selectSession, newChat } = useSessions();

  return (
    <div className="flex h-screen flex-col">
      <MobileHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={selectSession}
          onNewChat={newChat}
        />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
