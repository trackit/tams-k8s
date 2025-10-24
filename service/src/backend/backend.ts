export interface BucketInformation {
    label: string;
    region: string;
    availabilityZone: string;
    storeType: string;
    storeProduct: string;
    provider: string;
}

export interface GetPresignedUrlOptions {
    contentType?: string;
    expiresIn?: number;
}

export type GetPresignedUrlMode = 'GET' | 'PUT';

export interface Backend {
    initialize(): Promise<void>;
    getId(): string;
    getPresignedUrl(mode: GetPresignedUrlMode, key: string, opts?: GetPresignedUrlOptions): Promise<string>;
    isDefault(): boolean;
    getBucketInformation(): Promise<BucketInformation>;
}
