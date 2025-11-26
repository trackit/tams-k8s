import { createInjectionToken } from "../di";
import { BackendConfig } from "../configParser";
import { Backend } from "./backend";
import { S3BackendImpl } from "./s3/backend";

export class BackendManager {
    private readonly configs: BackendConfig[];
    private readonly backendList: Backend[];
    private readonly backendMap: Record<string, Backend>;
    private readonly backendDefault: Backend | undefined;

    constructor(configs: BackendConfig[]) {
        this.configs = configs;
        this.backendList = [];
        this.backendMap = {};
        this.backendDefault = undefined;

        for (const config of this.configs) {
            switch (config.type) {
                case 's3':
                    const instance = new S3BackendImpl(config);
                    this.backendList.push(instance);
                    this.backendMap[config.id] = instance;
                    if (config.default) {
                        this.backendDefault = instance;
                    }
                    break;
                case 'memory':
                    const instanceMemory = {}
                    if (config.default) {
                      this.backendDefault = instanceMemory as Backend;
                    }
                    break;
            }
        }
        if (!this.backendDefault) {
            throw new Error('No default backend configured');
        }
    }

    async initialize() {
        await Promise.all(this.backendList.map(async (backend) => (
            backend.initialize()
        )))
    }

    getDefaultBackend(): Backend {
        if (!this.backendDefault) throw new Error('No default backend configured');
        return this.backendDefault;
    }

    getBackendById(id: string): Backend | null {
        if (!this.backendMap[id]) return null;
        return this.backendMap[id];
    }

    getBackends(): Backend[] {
        return this.backendList;
    }
}

export const backendManagerToken = createInjectionToken<BackendManager>('BackendManager');
