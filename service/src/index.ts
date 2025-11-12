import { log } from "@tams-k8s/logger";
import { ConfigReader } from "./configParser/reader";
import { BackendManager } from "./backend/manager";
import { RepositoriesBuilder } from "./repository/builder";
import { setUpApp } from "setUpApp";

const config = new ConfigReader().getCachedConfig();

const main = async () => {
  const backends = new BackendManager(config.backends);
  await backends.initialize();

  const repositories = new RepositoriesBuilder(config.database);
  await repositories.initialize();

  const app = setUpApp(repositories, backends);

  app.listen(config.server.port, () => log.info(`Server is running on port ${config.server.port}`));
};
main().catch(err => {
  log.error(err);
  process.exit(1);
});

