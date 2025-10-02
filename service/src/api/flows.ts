export enum FormatUrn {
    VIDEO = 'urn:x-nmos:format:video',
    IMAGE = 'urn:x-nmos:format:image',
    AUDIO = 'urn:x-nmos:format:audio',
    DATA = 'urn:x-nmos:format:data',
    MULTI = 'urn:x-nmos:format:multi'
}

export interface GetFlowsQueryParamsRequest {
    source_id?: string;
    timerange: string;
    format?: FormatUrn;
    codec?: string;
    label?: string;
    frame_width?: number;
    frame_height?: number;
    [key: `tags.${string}`]: string;
    [key: `tags_exists.${string}`]: string;
}

export interface VideoFlow {
    id: string;
    source_id: string;
    label: string;
    description?: string;
    created_by: string;
    updated_by: string;
    tags: Record<string, string>;
}
export type Flow = VideoFlow;
