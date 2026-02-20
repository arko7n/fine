"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchMe, provisionTask, type ProvisionStatus } from "@/lib/api";

const POLL_INTERVAL = 3000;

export function useProvision() {
  const [status, setStatus] = useState<ProvisionStatus | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    const me = await fetchMe();
    setStatus(me.status);
    if (me.status === "running" || me.status === "stopped") {
      setIsProvisioning(false);
      stopPolling();
    }
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
  }, [poll]);

  // Initial fetch on mount
  useEffect(() => {
    fetchMe().then((me) => {
      setStatus(me.status);
      if (me.status === "provisioning") {
        setIsProvisioning(true);
        startPolling();
      }
    });
    return stopPolling;
  }, [startPolling, stopPolling]);

  const provision = useCallback(async () => {
    setIsProvisioning(true);
    const result = await provisionTask();
    setStatus(result.status);
    if (result.status === "provisioning") {
      startPolling();
    } else if (result.status === "running") {
      setIsProvisioning(false);
    }
  }, [startPolling]);

  return { status, provision, isProvisioning };
}
