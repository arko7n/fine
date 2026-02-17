"use client";

import { type ReactNode } from "react";
import { SidebarProvider } from "@/components/layout/sidebar-provider";
import { ThreadsProvider } from "@/hooks/use-threads";
import { AppShell } from "@/components/layout/app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <ThreadsProvider>
        <AppShell>{children}</AppShell>
      </ThreadsProvider>
    </SidebarProvider>
  );
}
