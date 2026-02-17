"use client";

import { useCallback, useEffect, useState } from "react";
import { PROVIDERS } from "@/lib/constants";
import { listConnections, type Connection } from "@/lib/api";
import { IntegrationCard } from "./integration-card";
import { ConnectButton } from "./connect-button";

export function IntegrationGrid() {
  const [connections, setConnections] = useState<Connection[]>([]);

  const refresh = useCallback(async () => {
    const data = await listConnections();
    setConnections(data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connectedProviders = new Set(
    connections.filter((c) => c.body.status === "active").map((c) => c.body.provider)
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PROVIDERS.map((p) => (
        <IntegrationCard
          key={p.id}
          name={p.name}
          description={p.description}
          icon={p.icon}
          connected={connectedProviders.has(p.id)}
          connectButton={<ConnectButton provider={p.id} onSuccess={refresh} />}
        />
      ))}
    </div>
  );
}
