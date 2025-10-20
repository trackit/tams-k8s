import express from 'express';
import { log } from '@tams-k8s/logger';
import { BackendManager } from './backend/manager';
import { ConfigReader } from './configParser/reader';
import { RepositoriesBuilder } from './repository/builder';
import { bodyParser, errorHandler, validationHelper } from './routes/middlewares';
import { FlowsRoutes, RootRoutes, ServiceRoutes } from './routes';

const config = new ConfigReader().getCachedConfig();

const main = async () => {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', true);
    app.set('env', process.env.NODE_ENV || 'development');

    // enable receiving json
    app.use(bodyParser);

    const backends = new BackendManager(config.backends);
    await backends.initialize();

    const repositories = new RepositoriesBuilder(config.database);
    await repositories.initialize();

    const rootRoutes = new RootRoutes(repositories, backends);
    app.use('/', rootRoutes.getRoutes());

    const serviceRoutes = new ServiceRoutes(repositories, backends);
    app.use('/service', serviceRoutes.getRoutes());

    const flowRoutes = new FlowsRoutes(repositories, backends);
    app.use('/flows', flowRoutes.getRoutes());

    app.use(validationHelper);
    app.use(errorHandler);

    app.listen(config.server.port, () => log.info(`Server is running on port ${config.server.port}`));
};
main().catch((err) => {
    log.error(err);
    process.exit(1);
});

