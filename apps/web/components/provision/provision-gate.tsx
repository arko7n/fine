"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFineUser } from "@/hooks/use-fine-user";

/** Gates children behind provision status. Redirects to /provision if not running. */
export function ProvisionGate({ children }: { children: ReactNode }) {
  const { provisionStatus } = useFineUser();
  const router = useRouter();

  useEffect(() => {
    if (provisionStatus === "stopped") {
      router.replace("/provision");
    }
  }, [provisionStatus, router]);

  if (provisionStatus === null || provisionStatus === "provisioning" || provisionStatus === "stopped") {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
