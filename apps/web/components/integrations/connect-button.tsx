"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { createFrontendClient } from "@pipedream/sdk/browser";
import { Button } from "@/components/ui/button";
import { initiateConnect, handleConnectCallback } from "@/lib/api";

type Props = {
  provider: string;
  onSuccess?: () => void;
};

export function ConnectButton({ provider, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: plaidLinkToken,
    onSuccess: async (publicToken, metadata) => {
      await handleConnectCallback(provider, {
        public_token: publicToken,
        metadata,
      });
      onSuccess?.();
    },
    onExit: () => {
      setPlaidLinkToken(null);
      setLoading(false);
    },
  });

  // Auto-open Plaid Link as soon as the token is ready — no second click needed
  useEffect(() => {
    if (plaidLinkToken && plaidReady) {
      openPlaid();
    }
  }, [plaidLinkToken, plaidReady, openPlaid]);

  const handleConnect = useCallback(async () => {
    setLoading(true);
    try {
      const data = await initiateConnect(provider);

      if (data.type === "plaid") {
        setPlaidLinkToken(data.link_token as string);
        // Plaid Link opens automatically via useEffect above
      } else if (data.type === "pipedream") {
        const appSlug = (data.app as string) ?? provider;
        const pd = createFrontendClient({
          externalUserId: "current-user",
          tokenCallback: async () => ({
            token: data.token as string,
            expiresAt: new Date(data.expiresAt as string),
            connectLinkUrl: "",
          }),
        });

        await pd.connectAccount({
          app: appSlug,
          onSuccess: async (result) => {
            await handleConnectCallback(provider, {
              account_id: result.id,
            });
            onSuccess?.();
          },
        });
      }
    } finally {
      setLoading(false);
    }
  }, [provider, onSuccess]);

  return (
    <Button size="sm" onClick={handleConnect} disabled={loading}>
      {loading ? "Connecting..." : "Connect"}
    </Button>
  );
}
