"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useProvision } from "@/hooks/use-provision";

export default function AppRoot() {
  const { status } = useProvision();
  const router = useRouter();

  useEffect(() => {
    if (status === "running") {
      router.replace("/chat");
    } else if (status === "stopped") {
      router.replace("/provision");
    }
  }, [status, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}
