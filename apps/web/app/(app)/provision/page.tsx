"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProvision } from "@/hooks/use-provision";
import { ProvisionCard } from "@/components/provision/provision-card";

export default function ProvisionPage() {
  const { status, provision, isProvisioning } = useProvision();
  const router = useRouter();

  useEffect(() => {
    if (status === "running") {
      router.replace("/chat");
    }
  }, [status, router]);

  return (
    <ProvisionCard onProvision={provision} isProvisioning={isProvisioning} />
  );
}
