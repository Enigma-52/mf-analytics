import { Pool } from "pg";
import { config } from "../../config";

export const pg = new Pool({
  host: config.pg.host,
  port: config.pg.port,
  user: config.pg.user,
  password: config.pg.password,
  database: config.pg.database,
  ssl: false,   // 👈 ADD THIS

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
