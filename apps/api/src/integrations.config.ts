export type IntegrationDef = {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
  provider: string;
  toolPatterns: string[];
};

export const INTEGRATIONS: IntegrationDef[] = [
  {
    id: "plaid",
    label: "Your Bank",
    description: "Connect your bank accounts and financial data",
    icon: "landmark",
    enabled: false,
    provider: "bank",
    toolPatterns: ["plaid_*"],
  },
  {
    id: "ibkr",
    label: "Interactive Brokers",
    description: "Portfolio management and trading",
    icon: "trending-up",
    enabled: false,
    provider: "ibkr",
    toolPatterns: ["ibkr_*"],
  },
  {
    id: "robinhood",
    label: "Robinhood",
    description: "Commission-free stock trading",
    icon: "dollar-sign",
    enabled: false,
    provider: "robinhood",
    toolPatterns: ["robinhood_*"],
  },
];

export const getEnabled = () => INTEGRATIONS.filter((i) => i.enabled);
export const getEnabledToolPatterns = () =>
  getEnabled().flatMap((i) => i.toolPatterns);
