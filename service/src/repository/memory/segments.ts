import Joi from "joi";
import { InvalidPageTokenError } from "../errors";
import type {
  CreateSegmentsResult,
  DeleteSegmentsFilters,
  ListSegmentsFilters,
  ListSegmentsResponse,
  Segment,
  SegmentFailure,
  SegmentRepository,
} from "../segments";

export class MemorySegmentsRepository implements SegmentRepository {
  private readonly segments: Segment[];

  constructor(initialSegments?: Segment[]) {
    this.segments = initialSegments ?? [];
  }

  private encodePageToken(objectId: string): string {
    return Buffer.from(objectId, "utf8").toString("base64url");
  }

  private decodePageToken(pageToken: string): string {
    try {
      const decoded = Buffer.from(pageToken, "base64url").toString("utf8");
      Joi.assert(decoded, Joi.string().min(1).required());
      return decoded;
    } catch (e) {
      throw new InvalidPageTokenError();
    }
  }

  public getInternal(): Segment[] {
    return this.segments;
  }

  async listSegments(
    filters: ListSegmentsFilters
  ): Promise<ListSegmentsResponse> {
    let filteredSegments = this.segments.filter(
      (segment) => segment.flowId === filters.flowId
    );

    if (filters.objectId) {
      filteredSegments = filteredSegments.filter(
        (segment) => segment.objectId === filters.objectId
      );
    }

    // TODO: Implement timerange overlap filtering when PR #27 is merged
    // For now, we'll do basic string matching or skip
    if (filters.timerange) {
      const queryMatch = filters.timerange.match(/(-?\d+):(-?\d+)/);
      if (queryMatch) {
        const queryStart = parseInt(queryMatch[1], 10);
        const queryEnd = parseInt(queryMatch[2], 10);

        filteredSegments = filteredSegments.filter((segment) => {
          const segmentMatch = segment.timerange.match(/(-?\d+):(-?\d+)/);
          if (!segmentMatch) return false;

          const segmentStart = parseInt(segmentMatch[1], 10);
          const segmentEnd = parseInt(segmentMatch[2], 10);

          return segmentEnd > queryStart && segmentStart < queryEnd;
        });
      }
    }

    if (filters.reverseOrder) {
      filteredSegments = [...filteredSegments].reverse();
    }

    if (filters.pageToken) {
      const decoded = this.decodePageToken(filters.pageToken);
      const index = filteredSegments.findIndex(
        (segment) => segment.objectId === decoded
      );
      if (index === -1) {
        throw new InvalidPageTokenError();
      }
      filteredSegments = filteredSegments.slice(index + 1);
    }

    let nextPageToken: string | undefined = undefined;
    if (filters.limit) {
      if (filteredSegments.length > filters.limit) {
        nextPageToken = this.encodePageToken(
          filteredSegments[filters.limit - 1].objectId
        );
      }
      filteredSegments = filteredSegments.slice(0, filters.limit);
    }

    // TODO: Handle includeObjectTimerange parameter - filter out object_timerange field if false

    return {
      segments: filteredSegments,
      limit: filters.limit,
      nextPageToken,
    };
  }

  async createSegments(
    flowId: string,
    segments: Segment[]
  ): Promise<CreateSegmentsResult> {
    const created: Segment[] = [];
    const failed: SegmentFailure[] = [];

    for (const segment of segments) {
      try {
        const segmentToCreate = { ...segment, flowId };

        const existingIndex = this.segments.findIndex(
          (s) =>
            s.flowId === segmentToCreate.flowId &&
            s.objectId === segmentToCreate.objectId
        );

        if (existingIndex === -1) {
          this.segments.push(segmentToCreate);
        } else {
          this.segments[existingIndex] = segmentToCreate;
        }

        created.push(segmentToCreate);
      } catch (error) {
        failed.push({
          objectId: segment.objectId,
          timerange: segment.timerange,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      created,
      failed: failed.length > 0 ? failed : undefined,
    };
  }

  async deleteSegments(
    flowId: string,
    filters: DeleteSegmentsFilters
  ): Promise<void> {
    const toDelete: Segment[] = [];

    for (const segment of this.segments) {
      if (segment.flowId !== flowId) continue;

      if (filters.objectId && segment.objectId !== filters.objectId) continue;

      if (filters.timerange) {
        const queryMatch = filters.timerange.match(/(-?\d+):(-?\d+)/);
        const segmentMatch = segment.timerange.match(/(-?\d+):(-?\d+)/);

        if (queryMatch && segmentMatch) {
          const queryStart = parseInt(queryMatch[1], 10);
          const queryEnd = parseInt(queryMatch[2], 10);
          const segmentStart = parseInt(segmentMatch[1], 10);
          const segmentEnd = parseInt(segmentMatch[2], 10);

          if (segmentStart < queryStart || segmentEnd > queryEnd) {
            continue;
          }
        }
      }

      toDelete.push(segment);
    }

    for (const segment of toDelete) {
      const index = this.segments.findIndex(
        (s) => s.flowId === segment.flowId && s.objectId === segment.objectId
      );
      if (index !== -1) {
        this.segments.splice(index, 1);
      }
    }
  }
}
