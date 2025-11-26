import { Service, ServiceRepository, ServiceUpdate } from "../service";

export class MemoryServiceRepository implements ServiceRepository {
    private service: Service;

    constructor(initialService?: Service) {
        this.service = initialService ?? {
            name: '',
            description: ''
        }
    }

    getInternal(): Service {
        return this.service;
    }

    getService(): Promise<Service> {
        return Promise.resolve(this.service);
    }

    updateService(next: ServiceUpdate): Promise<void> {
        this.service = {
            name: next.name,
            description: next.description || ''
        };
        return Promise.resolve(undefined);
    }
}
