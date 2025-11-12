import express from 'express';
import { BackendManager } from './backend/manager';
import { Factory } from './repository/factory';
import { FlowsRoutes, RootRoutes, ServiceRoutes } from './routes';
import { bodyParser, errorHandler, validationHelper } from './routes/middlewares';
import { SourcesRoutes } from './routes/sources';

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
