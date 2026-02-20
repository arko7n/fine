"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFineUser } from "@/hooks/use-fine-user";
import { ProvisionCard } from "@/components/provision/provision-card";

export default function ProvisionPage() {
  const { provisionStatus, provision, isProvisioning } = useFineUser();
  const router = useRouter();

  useEffect(() => {
    if (provisionStatus === "running") {
      router.replace("/chat");
    }
  }, [provisionStatus, router]);

  return (
    <ProvisionCard onProvision={provision} isProvisioning={isProvisioning} />
  );
}
