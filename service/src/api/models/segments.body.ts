export interface Segment {
  object_id: string;
  timerange: string;
  ts_offset?: string;
  last_duration?: string;
  object_timerange?: string;
  sample_offset?: number; // deprecated
  sample_count?: number; // deprecated
  get_urls?: GetUrl[];
  key_frame_count?: number;
}

export interface GetUrl {
  storage_id?: string;
  url: string;
  presigned?: boolean;
  label?: string;
  controlled?: boolean;
}

export interface SegmentBulkFailureResponse {
  failed_segments: FailedSegmentItem[];
}

export interface FailedSegmentItem {
  object_id: string;
  timerange?: string;
  error: {
    code: number;
    error: string;
    debug?: string;
  };
}
