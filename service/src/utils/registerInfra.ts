import { register } from "../di";
import { Config } from "../configParser";
import {
  flowDeleteRequestsRepositoryToken,
  flowRepositoryToken,
  mediaObjectRepositoryToken,
  segmentRepositoryToken,
  serviceRepositoryToken,
  sourceRepositoryToken,
} from "../repository";
import {
  dynamodbConfigToken,
  DDBFlowDeleteRequestsRepository,
  DDBSourcesRepository,
  DDBServiceRepository,
  DDBFlowsRepository,
  DDBMediaObjectsRepository,
  DDBSegmentsRepository,
} from "../repository/dynamodb";
import { ensureDynamoTables } from "../repository/dynamodb/client";
import {
  MemoryFlowDeleteRequestsRepository,
  MemoryFlowsRepository,
  MemoryMediaObjectRepository,
  MemorySegmentsRepository,
  MemoryServiceRepository,
  MemorySourceRepository,
} from "../repository/memory";
import { BackendManager, backendManagerToken } from "../backend/manager";

export const registerConfig = (config: Config) => {
  register(dynamodbConfigToken, {
    useValue: config.database,
  });

  register(backendManagerToken, {
    useValue: new BackendManager(config.backends),
  });
};

export const registerDynamoInfra = () => {
  register(mediaObjectRepositoryToken, {
    useClass: DDBMediaObjectsRepository,
  });

  register(flowRepositoryToken, {
    useClass: DDBFlowsRepository,
  });

  register(flowDeleteRequestsRepositoryToken, {
    useClass: DDBFlowDeleteRequestsRepository,
  });

  register(sourceRepositoryToken, {
    useClass: DDBSourcesRepository,
  });

  register(serviceRepositoryToken, {
    useClass: DDBServiceRepository,
  });

  register(segmentRepositoryToken, {
    useClass: DDBSegmentsRepository,
  });
};

export const registerMemoryInfra = () => {
  register(mediaObjectRepositoryToken, {
    useValue: new MemoryMediaObjectRepository(),
  });

  register(flowRepositoryToken, {
    useValue: new MemoryFlowsRepository(),
  });

  register(flowDeleteRequestsRepositoryToken, {
    useValue: new MemoryFlowDeleteRequestsRepository(),
  });

  register(sourceRepositoryToken, {
    useValue: new MemorySourceRepository(),
  });

  register(serviceRepositoryToken, {
    useValue: new MemoryServiceRepository(),
  });

  register(segmentRepositoryToken, {
    useValue: new MemorySegmentsRepository(),
  });
};

export const registerInfra = async (config: Config) => {
  registerConfig(config);

  if (config.database.type === "dynamodb") {
    await ensureDynamoTables();
    registerDynamoInfra();
  } else {
    registerMemoryInfra();
  }
};
