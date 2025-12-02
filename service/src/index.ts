import { log } from "@tams-k8s/logger";
import { ConfigReader } from "./configParser/reader";
import { setupApp } from "./setupApp";
import { registerInfra } from "./registerInfra";

const config = new ConfigReader().getCachedConfig();

const main = async () => {
  await registerInfra(config);
  const app = setupApp();

  app.listen(config.server.port, () =>
    log.info(`Server is running on port ${config.server.port}`)
  );
};

main().catch((err) => {
  log.error(err);
  process.exit(1);
});
