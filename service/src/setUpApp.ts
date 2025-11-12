import { bodyParser, errorHandler, validationHelper } from "./routes/middlewares";
import { FlowsRoutes, RootRoutes, ServiceRoutes, FlowDeleteRequestsRoutes } from "./routes";
import express from "express";
import { BackendManager } from "./backend/manager";
import { RepositoriesBuilder } from "./repository/builder";

export const setUpApp = (repositories: RepositoriesBuilder, backends: BackendManager) => {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", true);
  app.set("env", process.env.NODE_ENV || "development");

  // enable receiving json
  app.use(bodyParser);
  const rootRoutes = new RootRoutes(repositories, backends);
  app.use("/", rootRoutes.getRoutes());

  const serviceRoutes = new ServiceRoutes(repositories, backends);
  app.use("/service", serviceRoutes.getRoutes());

  const flowRoutes = new FlowsRoutes(repositories, backends);
  app.use("/flows", flowRoutes.getRoutes());

  const flowDeleteRequestsRoutes = new FlowDeleteRequestsRoutes(repositories, backends);
  app.use("/flow-delete-requests", flowDeleteRequestsRoutes.getRoutes());

  app.use(validationHelper);
  app.use(errorHandler);

  return app;
};
