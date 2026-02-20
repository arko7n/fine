"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFineUser } from "@/hooks/use-fine-user";

export default function AppRoot() {
  const { provisionStatus } = useFineUser();
  const router = useRouter();

  useEffect(() => {
    if (provisionStatus === "running") {
      router.replace("/chat");
    } else if (provisionStatus === "stopped") {
      router.replace("/provision");
    }
  }, [provisionStatus, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}
