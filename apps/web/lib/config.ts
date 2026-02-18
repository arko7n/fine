const environments = {
  local: {
    apiUrl: "http://localhost:3001",
  },
  dev: {
    apiUrl: "https://api.dev.fine.getfine.pro",
  },
  prod: {
    apiUrl: "https://api.prod.fine.getfine.pro",
  },
} as const;

type Mode = keyof typeof environments;
const mode = (process.env.NEXT_PUBLIC_MODE ?? "dev") as Mode;

const config = {
  ...environments[mode],
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
};

export default config;
