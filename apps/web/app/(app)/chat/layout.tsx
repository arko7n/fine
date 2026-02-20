"use client";

import { type ReactNode } from "react";
import { SessionsProvider } from "@/hooks/use-sessions";
import { ProvisionGate } from "@/components/provision/provision-gate";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <ProvisionGate>
      <SessionsProvider>{children}</SessionsProvider>
    </ProvisionGate>
  );
}
