import { PartialBy } from "../helper";

export interface Service {
    name: string;
    description: string;
}

export type ServiceUpdate = PartialBy<Service, 'description'>;

export abstract class ServiceRepository {
    getService(): Promise<Service> {
        throw new Error("Not implemented");
    };

    updateService(next: ServiceUpdate): Promise<void> {
        throw new Error("Not implemented");
    }
}
