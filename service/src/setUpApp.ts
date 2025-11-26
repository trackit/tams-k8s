import { bodyParser, errorHandler, validationHelper } from "./routes/middlewares";
import { FlowsRoutes, RootRoutes, ServiceRoutes, FlowDeleteRequestsRoutes } from "./routes";
import express from "express";
import { BackendManager } from "./backend/manager";
import { SourcesRoutes } from "./routes/sources";
import { Factory } from "repository";

export const setupApp = (repositories: Factory, backends: BackendManager) => {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", true);
  app.set("env", process.env.NODE_ENV || "development");

  // enable receiving json
  app.use(bodyParser);
  const rootRoutes = new RootRoutes();
  app.use("/", rootRoutes.getRoutes());

  const serviceRoutes = new ServiceRoutes(backends);
  app.use("/service", serviceRoutes.getRoutes());

  const flowRoutes = new FlowsRoutes(repositories, backends);
  app.use("/flows", flowRoutes.getRoutes());

  const sourcesRoutes = new SourcesRoutes();
  app.use("/sources", sourcesRoutes.getRoutes());

  const flowDeleteRequestsRoutes = new FlowDeleteRequestsRoutes();
  app.use("/flow-delete-requests", flowDeleteRequestsRoutes.getRoutes());

  app.use(validationHelper);
  app.use(errorHandler);

  return app;
};
