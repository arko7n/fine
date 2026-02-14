const config = {
  local: {
    apiUrl: "http://localhost:3001",
  },
  dev: {
    apiUrl: "http://fine-d-Publi-tabImqOrLmwA-62463417.us-west-2.elb.amazonaws.com",
  },
  prod: {
    apiUrl: "https://api.fine.com",
  },
} as const;

type Mode = keyof typeof config;

const mode = (process.env.NEXT_PUBLIC_MODE ?? "local") as Mode;

export default config[mode];
