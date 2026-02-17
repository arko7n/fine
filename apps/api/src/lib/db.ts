import pg from "pg";
import config from "../config.js";

const pool = new pg.Pool({
  user: config.pgUser,
  password: config.pgPassword,
  host: config.pgHost,
  database: config.pgDatabase,
  port: config.pgPort,
});

export default pool;
