import { log } from "@tams-k8s/logger";
import { ConfigReader } from "./configParser/reader";
import { BackendManager } from "./backend/manager";
import { RepositoriesBuilder } from "./repository/builder";
import { setUpApp } from "setUpApp";

const config = new ConfigReader().getCachedConfig();

registerInfra(config);

const main = async () => {
  await backends.initialize();
  await repositories.initialize();

  const app = setUpApp();

  app.listen(config.server.port, () => log.info(`Server is running on port ${config.server.port}`));
};
main().catch(err => {
  log.error(err);
  process.exit(1);
});
