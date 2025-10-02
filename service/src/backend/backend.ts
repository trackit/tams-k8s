export interface BucketInformation {
    label: string
    region: string
    availabilityZone: string
    storeType: string;
    storeProduct: string;
    provider: string;
}

export interface Backend {
    initialize(): Promise<void>
    getId(): string
    isDefault(): boolean
    getBucketInformation(): Promise<BucketInformation>
}
