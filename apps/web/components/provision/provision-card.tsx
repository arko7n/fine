"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type ProvisionCardProps = {
  onProvision: () => void;
  isProvisioning: boolean;
};

export function ProvisionCard({ onProvision, isProvisioning }: ProvisionCardProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Provision your AI agent to begin. This starts a dedicated environment for your sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={onProvision}
            disabled={isProvisioning}
          >
            {isProvisioning ? (
              <>
                <Loader2 className="animate-spin" />
                Provisioning...
              </>
            ) : (
              "Provision Agent"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
