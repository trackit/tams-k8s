import type { DBConfig } from '../config';
import { DDBRepositoryFactory } from "./dynamodb/factory";
import  { type Factory } from "./factory";
import  { FlowRepository } from "./flows";
import { MemoryRepositoryFactory } from "./memory/factory";
import { ServiceRepository } from "./service";

export class RepositoriesBuilder implements Factory {
    private readonly config: DBConfig;

    private factory: Factory;

    constructor(config: DBConfig) {
        this.config = config;
        switch (this.config.type) {
            case "dynamodb":
                this.factory = new DDBRepositoryFactory(this.config);
                break;
            case "memory":
                this.factory = new MemoryRepositoryFactory();
                break
            default:
                throw new Error(`Unknown configuration database type: "${config.type}"`);
        }
    }

    async initialize() {
        await this.factory.initialize();
    }

    getFlowRepository(): FlowRepository {
        return this.factory.getFlowRepository();
    }

    getServiceRepository(): ServiceRepository {
        return this.factory.getServiceRepository();
    }
}
