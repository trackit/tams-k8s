import {
  bodyParser,
  errorHandler,
  validationHelper,
} from "./routes/middlewares";
import {
  FlowsRoutes,
  SourcesRoutes,
  RootRoutes,
  ServiceRoutes,
  FlowDeleteRequestsRoutes,
} from "./routes";
import express from "express";

export const setupApp = () => {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", true);
  app.set("env", process.env.NODE_ENV || "development");

  // enable receiving json
  app.use(bodyParser);
  const rootRoutes = new RootRoutes();
  app.use("/", rootRoutes.getRoutes());

  // TODO: Remove backends
  const serviceRoutes = new ServiceRoutes();
  app.use("/service", serviceRoutes.getRoutes());

  const flowRoutes = new FlowsRoutes();
  app.use("/flows", flowRoutes.getRoutes());

  const sourcesRoutes = new SourcesRoutes();
  app.use("/sources", sourcesRoutes.getRoutes());

  const flowDeleteRequestsRoutes = new FlowDeleteRequestsRoutes();
  app.use("/flow-delete-requests", flowDeleteRequestsRoutes.getRoutes());

  app.use(validationHelper);
  app.use(errorHandler);

  return app;
};
