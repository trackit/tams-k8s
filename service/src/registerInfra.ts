import { register } from "./di";
import { Config } from "./configParser";
import {
  flowDeleteRequestsRepositoryToken,
  serviceRepositoryToken,
  sourceRepositoryToken,
} from "./repository";
import {
  dynamodbConfigToken,
  DDBFlowDeleteRequestsRepository,
  DDBSourcesRepository,
  DDBServiceRepository,
} from "./repository/dynamodb";
import {
  MemoryFlowDeleteRequestsRepository,
  MemoryServiceRepository,
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
  register(serviceRepositoryToken, {
    useClass: DDBServiceRepository,
  });
};

const registerMemoryInfra = () => {
  register(flowDeleteRequestsRepositoryToken, {
    useValue: new MemoryFlowDeleteRequestsRepository(),
  });
  register(sourceRepositoryToken, {
    useValue: new MemorySourceRepository(),
  });
  register(serviceRepositoryToken, {
    useValue: new MemoryServiceRepository(),
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
