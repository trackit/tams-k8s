import { FormatUrn } from "./flows.body";

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

export interface GetFlowQueryParamsRequest {
    include_timerange?: boolean;
    timerange?: string;
}
