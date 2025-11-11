import express from 'express';
import { log } from '@tams-k8s/logger';
import { BackendManager } from './backend/manager';
import { ConfigReader } from './configParser/reader';
import { RepositoriesBuilder } from './repository/builder';
import { Factory } from './repository/factory';
import { bodyParser, errorHandler, validationHelper } from './routes/middlewares';
import { FlowsRoutes, RootRoutes, ServiceRoutes } from './routes';
import { SourcesRoutes } from 'routes/sources';

const config = new ConfigReader().getCachedConfig();

export const setupExpressApp = (repositories: Factory, backends: BackendManager) => {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', true);
    app.set('env', process.env.NODE_ENV || 'development');

    // enable receiving json
    app.use(bodyParser);

    // setup routes
    const rootRoutes = new RootRoutes(repositories, backends);
    app.use('/', rootRoutes.getRoutes());

    const serviceRoutes = new ServiceRoutes(repositories, backends);
    app.use('/service', serviceRoutes.getRoutes());

    const flowRoutes = new FlowsRoutes(repositories, backends);
    app.use('/flows', flowRoutes.getRoutes());

    const sourcesRoutes = new SourcesRoutes(repositories, backends);
    app.use('/sources', sourcesRoutes.getRoutes());

    app.use(validationHelper);
    app.use(errorHandler);

    return app;
}

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

