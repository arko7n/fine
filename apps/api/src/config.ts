import constants from "../constants.json" with { type: "json" };

type Env = "local" | "dev" | "prod";
const env = (process.env.APP_ENV ?? "dev") as Env;

const shared = {
  fcPort: constants.ports.openclaw,
  plaidEnv: "sandbox" as const,
  bankProvider: "plaid-direct" as "plaid-direct" | "plaid-pipedream",
};

const environments = {
  local: {
    ...shared,
    port: constants.ports.api,
    logLevel: "trace",
    bypassAuth: true,
    pipedreamPublicKey: "",
    pipedreamProjectId: "",
  },
  dev: {
    ...shared,
    port: constants.ports.api,
    logLevel: "info",
    bypassAuth: true,
    pipedreamPublicKey: "",
    pipedreamProjectId: "",
  },
  prod: {
    ...shared,
    port: constants.ports.api,
    logLevel: "info",
    bypassAuth: false,
    pipedreamPublicKey: "",
    pipedreamProjectId: "",
  },
} as const;

const config = {
  env,
  ...environments[env],

  // PG — non-secret values from constants.json, password from env
  pgUser: constants.pg.user,
  pgHost: constants.pg.host,
  pgDatabase: constants.pg.database,
  pgPort: constants.pg.port,
  pgPassword: process.env.PGPASSWORD ?? "",

  // Secrets — always from env vars
  plaidClientId: process.env.PLAID_CLIENT_ID ?? "",
  plaidSecret: process.env.PLAID_SECRET ?? "",
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  pipedreamSecretKey: process.env.PIPEDREAM_SECRET_KEY ?? "",
};

export default config;
