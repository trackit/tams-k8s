export interface Service {
    name: string;
    description: string;
}

export interface ServiceUpdate {
    name: string;
    description?: string;
}

export interface ServiceRepository {
    getService(): Promise<Service>
    updateService(next: ServiceUpdate): Promise<void>
}
