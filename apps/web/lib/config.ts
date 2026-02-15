const config = {
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

type Mode = keyof typeof config;

const mode = (process.env.NEXT_PUBLIC_MODE ?? "local") as Mode;

export default config[mode];
