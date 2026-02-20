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
    useLocalBackend: true,
    pipedreamProjectId: "proj_ddsPejA",
    pipedreamProjectEnvironment: "development",
  },
  dev: {
    ...shared,
    port: constants.ports.api,
    logLevel: "info",
    bypassAuth: true,
    useLocalBackend: false,
    pipedreamProjectId: "proj_ddsPejA",
    pipedreamProjectEnvironment: "development",
  },
  prod: {
    ...shared,
    port: constants.ports.api,
    logLevel: "info",
    bypassAuth: false,
    useLocalBackend: false,
    pipedreamProjectId: "proj_ddsPejA",
    pipedreamProjectEnvironment: "production",
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
  pipedreamClientId: process.env.PIPEDREAM_CLIENT_ID ?? "",
  pipedreamClientSecret: process.env.PIPEDREAM_CLIENT_SECRET ?? "",
};

export default config;
