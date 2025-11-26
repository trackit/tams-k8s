import { log } from "@tams-k8s/logger";
import { ConfigReader } from "./configParser/reader";
import { BackendManager } from "./backend/manager";
import { RepositoriesBuilder } from "./repository/builder";
import { setupApp } from "./setupApp";
import { registerInfra } from "./registerInfra";

const config = new ConfigReader().getCachedConfig();

const main = async () => {
  registerInfra(config);

  // To remove
  const backends = new BackendManager(config.backends);
  const repositories = new RepositoriesBuilder(config.database);

  await backends.initialize();
  await repositories.initialize();

  const app = setupApp(repositories, backends);

  app.listen(config.server.port, () =>
    log.info(`Server is running on port ${config.server.port}`)
  );
};

main().catch((err) => {
  log.error(err);
  process.exit(1);
});
