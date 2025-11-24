import { register } from "./di";
import { Config } from "./configParser";
import {
  flowDeleteRequestsRepositoryToken,
  sourceRepositoryToken,
} from "./repository";
import {
  dynamodbConfigToken,
  DDBFlowDeleteRequestsRepository,
  DDBSourcesRepository,
} from "./repository/dynamodb";
import {
  MemoryFlowDeleteRequestsRepository,
  MemorySourceRepository,
} from "./repository/memory";

const registerConfig = (config: Config) => {
  register(dynamodbConfigToken, {
    useValue: config.database,
  });
};

const registerDynamoInfra = () => {
  register(flowDeleteRequestsRepositoryToken, {
    useClass: DDBFlowDeleteRequestsRepository,
  });
  register(sourceRepositoryToken, {
    useClass: DDBSourcesRepository,
  });
};

const registerMemoryInfra = () => {
  register(flowDeleteRequestsRepositoryToken, {
    useClass: MemoryFlowDeleteRequestsRepository,
  });
  register(sourceRepositoryToken, {
    useClass: MemorySourceRepository,
  });
};

export const registerInfra = (config?: Config) => {
  if (config?.database.type === "dynamodb") {
    registerConfig(config);
    registerDynamoInfra();
  } else {
    registerMemoryInfra();
  }
};
