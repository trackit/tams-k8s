import express from 'express';
import { log } from "@tams-k8s/logger";
import { readConfig } from "./config/reader";
import { RepositoriesBuilder } from "./repository/builder";
import { FlowsRoutes } from "./routes/flows";
import { RootRoutes } from "./routes/root";
import { ServiceRoutes } from "./routes/service";
import { validationErrorHandler } from "./routes/validationErrorHandler";


const config = readConfig();

const main = async () => {
    const PORT = parseInt(process.env.PORT || '3000', 10);
    const app = express();

    // enable receiving json
    app.use(express.json());

    const repositories = new RepositoriesBuilder(config.database);
    await repositories.initialize();

    const rootRoutes = new RootRoutes(repositories);
    app.use('/', rootRoutes.getRoutes());

    const serviceRoutes = new ServiceRoutes(repositories);
    app.use('/service', serviceRoutes.getRoutes());

    const flowRoutes = new FlowsRoutes(repositories);
    app.use('/flows', flowRoutes.getRoutes());

    app.use(validationErrorHandler);

    app.listen(PORT, () => log.info(`Server is running on port ${PORT}`));
};
main().catch((err) => {
    log.error(err);
    process.exit(1);
});

