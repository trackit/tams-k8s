export interface GetServiceResponse {
    name: string;
    description: string;
    type: string;
    api_version: string;
    service_version: string;
    event_stream_mechanisms: [];
}

export interface PostServiceRequest {
    name: string;
    description?: string;
}

export interface StorageBackend {
    id: string;
    label: string;
    store_type: string;
    provider: string;
    region: string;
    availability_zone: string;
    store_product: string;
    default_storage?: boolean;
}
export type StorageBackends = StorageBackend[];
