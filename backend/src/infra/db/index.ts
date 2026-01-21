import { drizzle } from "drizzle-orm/node-postgres";
import { pg } from "./pg"; // or your Pool export
import * as schema from "./schema";

export const db = drizzle(pg, { schema });
