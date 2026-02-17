import type { ConnectionRow } from "./connection-store.js";

export interface ProviderHandler {
  initiateConnect(
    userId: string,
    params?: Record<string, unknown>
  ): Promise<Record<string, unknown>>;

  handleCallback(
    userId: string,
    payload: Record<string, unknown>
  ): Promise<ConnectionRow>;

  getAgentContext?(connections: ConnectionRow[]): string | null;

  disconnect?(connectionId: string): Promise<void>;
}

const registry = new Map<string, ProviderHandler>();

export function registerProvider(name: string, handler: ProviderHandler) {
  registry.set(name, handler);
}

export function getProvider(name: string): ProviderHandler | undefined {
  return registry.get(name);
}

export function hasProvider(name: string): boolean {
  return registry.has(name);
}
