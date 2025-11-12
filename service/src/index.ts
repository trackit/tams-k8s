import express from 'express';
import { log } from '@tams-k8s/logger';
import { BackendManager } from './backend/manager';
import { ConfigReader } from './configParser/reader';
import { RepositoriesBuilder } from './repository/builder';
import { Factory } from './repository/factory';
import { bodyParser, errorHandler, validationHelper } from './routes/middlewares';
import { FlowsRoutes, RootRoutes, ServiceRoutes } from './routes';
import { SourcesRoutes } from 'routes/sources';
import { setupExpressApp } from './setupApp';

const config = new ConfigReader().getCachedConfig();

const main = async () => {
    const backends = new BackendManager(config.backends);
    await backends.initialize();

    const repositories = new RepositoriesBuilder(config.database);
    await repositories.initialize();

    const app = setupExpressApp(repositories, backends);

    app.listen(config.server.port, () => log.info(`Server is running on port ${config.server.port}`));
};
main().catch((err) => {
    log.error(err);
    process.exit(1);
});

