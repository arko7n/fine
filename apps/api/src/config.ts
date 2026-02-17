type Env = "local" | "dev" | "prod";
const env = (process.env.APP_ENV ?? "dev") as Env;

const shared = {
  openclawPort: 18789,
  openclawToken: "fine-internal",
  plaidEnv: "sandbox" as const,
  bankProvider: "plaid-direct" as "plaid-direct" | "plaid-pipedream",
};

const environments = {
  local: {
    ...shared,
    port: 3001,
    logLevel: "debug",
    pgUser: "postgres",
    pgHost: "localhost",
    pgDatabase: "fine",
    pgPort: 5432,
    bypassAuth: true,
    pipedreamPublicKey: "",
    pipedreamProjectId: "",
  },
  dev: {
    ...shared,
    port: 3001,
    logLevel: "info",
    pgUser: "postgres",
    pgHost: "anthrive-db-1.cluster-ci1lbpace9fg.us-west-2.rds.amazonaws.com",
    pgDatabase: "anthrive",
    pgPort: 5432,
    bypassAuth: false,
    pipedreamPublicKey: "",
    pipedreamProjectId: "",
  },
  prod: {
    ...shared,
    port: 3001,
    logLevel: "warn",
    pgUser: "postgres",
    pgHost: "",
    pgDatabase: "",
    pgPort: 5432,
    bypassAuth: false,
    pipedreamPublicKey: "",
    pipedreamProjectId: "",
  },
} as const;

const config = {
  env,
  ...environments[env],

  // Secrets — always from env vars
  pgPassword: process.env.PGPASSWORD ?? "",
  plaidClientId: process.env.PLAID_CLIENT_ID ?? "",
  plaidSecret: process.env.PLAID_SECRET ?? "",
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  pipedreamSecretKey: process.env.PIPEDREAM_SECRET_KEY ?? "",
};

export default config;
