import { Landmark, TrendingUp, DollarSign } from "lucide-react";

export const PROVIDERS = [
  {
    id: "bank" as const,
    name: "Your Bank",
    description: "Connect your bank accounts and financial data",
    icon: Landmark,
  },
  {
    id: "ibkr" as const,
    name: "Interactive Brokers",
    description: "Portfolio management and trading",
    icon: TrendingUp,
  },
  {
    id: "robinhood" as const,
    name: "Robinhood",
    description: "Commission-free stock trading",
    icon: DollarSign,
  },
] as const;
