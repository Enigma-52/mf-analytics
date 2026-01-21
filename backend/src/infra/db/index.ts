import { drizzle } from "drizzle-orm/node-postgres";
import { pg } from "./pg";
import * as schema from "./schema";

export const db = drizzle(pg, { schema });
