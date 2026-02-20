"use client";

import { type ReactNode } from "react";
import { ProvisionGate } from "@/components/provision/provision-gate";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <ProvisionGate>
      {children}
    </ProvisionGate>
  );
}
