"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import React from "react";
import {
  fetchMe,
  provisionTask,
  deprovisionTask,
  type ProvisionStatus,
} from "@/lib/api";

const POLL_INTERVAL = 3000;

type FineUserContext = {
  provisionStatus: ProvisionStatus | null;
  hasProvisioned: boolean;
  isProvisioning: boolean;
  provision: () => Promise<void>;
  deprovision: () => Promise<void>;
};

const Ctx = createContext<FineUserContext | null>(null);

export function FineUserProvider({ children }: { children: ReactNode }) {
  const [provisionStatus, setProvisionStatus] = useState<ProvisionStatus | null>(null);
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
    setProvisionStatus(me.provisionStatus);
    if (me.provisionStatus === "running" || me.provisionStatus === "stopped") {
      setIsProvisioning(false);
      stopPolling();
    }
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
  }, [poll]);

  useEffect(() => {
    fetchMe().then((me) => {
      setProvisionStatus(me.provisionStatus);
      if (me.provisionStatus === "provisioning") {
        setIsProvisioning(true);
        startPolling();
      }
    });
    return stopPolling;
  }, [startPolling, stopPolling]);

  const provision = useCallback(async () => {
    setIsProvisioning(true);
    const result = await provisionTask();
    setProvisionStatus(result.provisionStatus);
    if (result.provisionStatus === "provisioning") {
      startPolling();
    } else if (result.provisionStatus === "running") {
      setIsProvisioning(false);
    }
  }, [startPolling]);

  const deprovision = useCallback(async () => {
    setIsProvisioning(true);
    const result = await deprovisionTask();
    setProvisionStatus(result.provisionStatus);
    setIsProvisioning(false);
  }, []);

  const value: FineUserContext = {
    provisionStatus,
    hasProvisioned: provisionStatus === "running",
    isProvisioning,
    provision,
    deprovision,
  };

  return React.createElement(Ctx.Provider, { value }, children);
}

export function useFineUser(): FineUserContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFineUser must be used within FineUserProvider");
  return ctx;
}
