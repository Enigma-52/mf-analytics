import { createApp } from "./app";
import { config } from "./config";
import { logger } from "./shared/logger";
import { autoSeedIfNeeded } from "./infra/db/autoSeed";

async function main() {
  
  await autoSeedIfNeeded();  

  const app = await createApp();
  app.listen(config.app.port, () => {
    logger.info(`Server running on ${config.app.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
