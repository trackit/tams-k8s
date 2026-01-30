import { createInjectionToken } from "../di";

// Repository model interfaces (camelCase)

export interface Segment {
  flowId: string;
  objectId: string; // Unique identifier of the Media Object
  timerange: string;
  tsOffset?: string;
  lastDuration?: string;
  objectTimerange?: string;
  sampleOffset?: number; // deprecated
  sampleCount?: number; // deprecated
  getUrls?: GetUrl[];
  keyFrameCount?: number;
}

export interface GetUrl {
  storageId?: string;
  url: string;
  presigned?: boolean;
  label?: string;
  controlled?: boolean;
}

export interface ListSegmentsFilters {
  flowId: string;
  objectId?: string;
  timerange?: string; // TODO: Use TimerangeInterval when PR #27 is merged
  limit?: number;
  pageToken?: string;
  reverseOrder?: boolean;
  includeObjectTimerange?: boolean;
  // TODO: Storage backend filtering parameters (not implemented in this PR)
  // verboseStorage?: boolean;
  // acceptGetUrls?: string[];
  // acceptStorageIds?: string[];
  // presigned?: boolean;
}

export interface ListSegmentsResponse {
  segments: Segment[];
  limit?: number;
  nextPageToken?: string;
}

export interface DeleteSegmentsFilters {
  flowId: string;
  timerange?: string; // TODO: Use TimerangeInterval when PR #27 is merged
  objectId?: string;
}

export interface CreateSegmentsResult {
  created: Segment[];
  failed?: SegmentFailure[];
}

export interface SegmentFailure {
  objectId: string;
  timerange?: string;
  error: string; // Error message
}

export interface SegmentRepository {
  listSegments(filters: ListSegmentsFilters): Promise<ListSegmentsResponse>;
  createSegments(
    flowId: string,
    segments: Segment[]
  ): Promise<CreateSegmentsResult>;
  deleteSegments(
    flowId: string,
    filters: DeleteSegmentsFilters
  ): Promise<void>;
}

export const segmentRepositoryToken =
  createInjectionToken<SegmentRepository>("SegmentRepository");
