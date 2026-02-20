"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchPipedreamApps, type PipedreamApp, type Connection } from "@/lib/api";
import { PipedreamAppCard } from "./pipedream-app-card";

type Props = {
  connections: Connection[];
  onConnectionChange: () => void;
};

export function PipedreamAppGrid({ connections, onConnectionChange }: Props) {
  const [apps, setApps] = useState<PipedreamApp[]>([]);
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const loadApps = useCallback(async (q?: string) => {
    const results = await searchPipedreamApps(q, 20);
    setApps(results);
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadApps(value || undefined);
    }, 300);
  };

  const connectedSlugs = new Set(
    connections
      .filter((c) => c.body.status === "active")
      .map((c) => c.body.provider),
  );

  const connectedApps = connections.filter(
    (c) => c.body.status === "active" && c.id.startsWith("apn_"),
  );

  return (
    <div className="space-y-6">
      {connectedApps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Connected</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connectedApps.map((c) => (
              <PipedreamAppCard
                key={c.id}
                nameSlug={c.body.provider}
                name={(c.body.metadata.appName as string) || c.body.provider}
                description=""
                imgSrc={(c.body.metadata.imgSrc as string) || ""}
                connected
                onConnectionChange={onConnectionChange}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search 3000+ apps..."
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <PipedreamAppCard
              key={app.nameSlug}
              nameSlug={app.nameSlug}
              name={app.name}
              description={app.description}
              imgSrc={app.imgSrc}
              connected={connectedSlugs.has(app.nameSlug)}
              onConnectionChange={onConnectionChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
