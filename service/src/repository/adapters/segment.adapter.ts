import type { Segment as RepositorySegment, GetUrl as RepositoryGetUrl } from "../segments";

export interface ApiSegment {
  object_id: string;
  timerange: string;
  ts_offset?: string;
  last_duration?: string;
  object_timerange?: string;
  sample_offset?: number;
  sample_count?: number;
  get_urls?: ApiGetUrl[];
  key_frame_count?: number;
}

export interface ApiGetUrl {
  storage_id?: string;
  url: string;
  presigned?: boolean;
  label?: string;
  controlled?: boolean;
}

export class SegmentAdapter {
  static fromApi(apiSegment: ApiSegment, flowId: string): RepositorySegment {
    return {
      flowId,
      objectId: apiSegment.object_id,
      timerange: apiSegment.timerange,
      tsOffset: apiSegment.ts_offset,
      lastDuration: apiSegment.last_duration,
      objectTimerange: apiSegment.object_timerange,
      sampleOffset: apiSegment.sample_offset,
      sampleCount: apiSegment.sample_count,
      getUrls: apiSegment.get_urls?.map(SegmentAdapter.fromApiGetUrl),
      keyFrameCount: apiSegment.key_frame_count,
    };
  }

  private static fromApiGetUrl(apiGetUrl: ApiGetUrl): RepositoryGetUrl {
    return {
      storageId: apiGetUrl.storage_id,
      url: apiGetUrl.url,
      presigned: apiGetUrl.presigned,
      label: apiGetUrl.label,
      controlled: apiGetUrl.controlled,
    };
  }

  static toApi(repositorySegment: RepositorySegment): ApiSegment {
    return {
      object_id: repositorySegment.objectId,
      timerange: repositorySegment.timerange,
      ts_offset: repositorySegment.tsOffset,
      last_duration: repositorySegment.lastDuration,
      object_timerange: repositorySegment.objectTimerange,
      sample_offset: repositorySegment.sampleOffset,
      sample_count: repositorySegment.sampleCount,
      get_urls: repositorySegment.getUrls?.map(SegmentAdapter.toApiGetUrl),
      key_frame_count: repositorySegment.keyFrameCount,
    };
  }

  private static toApiGetUrl(repositoryGetUrl: RepositoryGetUrl): ApiGetUrl {
    return {
      storage_id: repositoryGetUrl.storageId,
      url: repositoryGetUrl.url,
      presigned: repositoryGetUrl.presigned,
      label: repositoryGetUrl.label,
      controlled: repositoryGetUrl.controlled,
    };
  }
}
