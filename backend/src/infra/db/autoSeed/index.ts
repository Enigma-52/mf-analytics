import { db } from "../index";
import { funds } from "../schema";
import { runSeed } from "./seed";
import { count } from "drizzle-orm";

export async function autoSeedIfNeeded() {
  const result = await db
    .select({ c: count() })
    .from(funds);

  const rowCount = Number(result[0].c);

  if (rowCount === 0) {
    console.log("Funds table empty. Running seed...");
    await runSeed();
  } else {
    console.log("Funds already seeded. Skipping seed.");
  }
}