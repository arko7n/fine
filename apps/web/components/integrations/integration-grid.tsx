"use client";

import { useCallback, useEffect, useState } from "react";
import { INTEGRATION_ICONS } from "@/lib/constants";
import {
  fetchIntegrations,
  listConnections,
  type Connection,
  type Integration,
} from "@/lib/api";
import { IntegrationCard } from "./integration-card";
import { ConnectButton } from "./connect-button";

export function IntegrationGrid() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  const refresh = useCallback(async () => {
    const [intData, connData] = await Promise.all([
      fetchIntegrations(),
      listConnections(),
    ]);
    setIntegrations(intData);
    setConnections(connData);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connectedProviders = new Set(
    connections
      .filter((c) => c.body.status === "active")
      .map((c) => c.body.provider)
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {integrations.map((p) => (
        <IntegrationCard
          key={p.id}
          name={p.label}
          description={p.description}
          icon={INTEGRATION_ICONS[p.icon]}
          connected={connectedProviders.has(p.provider)}
          connectButton={
            <ConnectButton provider={p.provider} onSuccess={refresh} />
          }
        />
      ))}
    </div>
  );
}
