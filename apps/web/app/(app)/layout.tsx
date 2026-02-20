"use client";

import { type ReactNode } from "react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { AuthInit } from "@/components/auth-init";
import { SidebarProvider } from "@/components/layout/sidebar-provider";
import { SessionsProvider } from "@/hooks/use-sessions";
import { AppShell } from "@/components/layout/app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <AuthInit />
        <SidebarProvider>
          <SessionsProvider>
            <AppShell>{children}</AppShell>
          </SessionsProvider>
        </SidebarProvider>
      </SignedIn>
    </>
  );
}
