import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  name: string;
  description: string;
  icon: LucideIcon;
  connected?: boolean;
  connectButton?: ReactNode;
};

export function IntegrationCard({ name, description, icon: Icon, connected, connectButton }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">{name}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardFooter>
        {connected ? (
          <Button variant="secondary" size="sm" disabled>
            Connected
          </Button>
        ) : connectButton ? (
          connectButton
        ) : (
          <Button variant="default" size="sm" disabled>
            Coming Soon
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
