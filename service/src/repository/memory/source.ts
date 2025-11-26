import { MediaObject } from '../mediaObjects';
import type {
  ListSourcesFilters,
  Source,
  SourceRepository,
  ListSourcesResponse,
} from "../index";
import Joi from "joi";
import { InvalidPageTokenError } from "../errors";

export class MemorySourceRepository implements SourceRepository {
  private readonly sources: Source[];

  constructor(initialSources?: Source[]) {
    this.sources = initialSources ?? [];
  }

  private encodePageToken(sourceId: string) {
    return Buffer.from(sourceId, "utf8").toString("base64url");
  }

  private decodePageToken(pageToken: string) {
    try {
      const decoded = Buffer.from(pageToken, "base64url").toString("utf8");
      Joi.assert(decoded, Joi.string().uuid().required());
      return decoded;
    } catch (e) {
      throw new InvalidPageTokenError();
    }
  }

  getInternal(): Source[] {
      return this.sources;
  }

  async listSources(
    filters?: ListSourcesFilters
  ): Promise<ListSourcesResponse> {
    let filteredSources = this.sources;
    let nextPageToken: string | undefined = undefined;

    if (filters) {
      const { format, label, tags, haveTags, doesNotHaveTags, page, limit } =
        filters;

      if (format) {
        filteredSources = filteredSources.filter((s) => s.format === format);
      }

      if (label) {
        const lowerLabel = label.toLowerCase();
        filteredSources = filteredSources.filter((s) =>
          s.label?.toLowerCase().includes(lowerLabel)
        );
      }

      if (tags) {
        filteredSources = filteredSources.filter((s) =>
          Object.entries(tags).every(([key, value]) => {
            const sourceValue = s.tags?.[key];

            if (!sourceValue) return false;

            if (typeof value === "string") {
              if (typeof sourceValue === "string") return sourceValue === value;
              return sourceValue.includes(value);
            }

            if (Array.isArray(value)) {
              const srcArray = Array.isArray(sourceValue)
                ? sourceValue
                : [sourceValue];
              return value.every((v) => srcArray.includes(v));
            }

            return false;
          })
        );
      }

      if (haveTags && haveTags.length > 0) {
        filteredSources = filteredSources.filter((s) =>
          haveTags.every((key) => s.tags && key in s.tags)
        );
      }

      if (doesNotHaveTags && doesNotHaveTags.length > 0) {
        filteredSources = filteredSources.filter(
          (s) => !doesNotHaveTags.some((key) => s.tags && key in s.tags)
        );
      }

      if (page) {
        const decoded = this.decodePageToken(page);
        const index = filteredSources.findIndex(({ id }) => id === decoded);
        if (index === -1) {
          throw new InvalidPageTokenError();
        }
        filteredSources = filteredSources.slice(index + 1);
      }

      if (limit) {
        if (filteredSources.length > limit) {
          nextPageToken = this.encodePageToken(filteredSources[limit - 1].id);
        }
        filteredSources = filteredSources.slice(0, limit);
      }
    }

    return {
      sources: filteredSources,
      limit: filters?.limit,
      nextPageToken: nextPageToken,
    };
  }

  async getSourceById(sourceId: string): Promise<Source | null> {
    return (
      this.sources.find(({ id: findSourceId }) => findSourceId === sourceId) ??
      null
    );
  }

  async putSource(source: Source): Promise<Source> {
    const indexToUpdate = this.sources.findIndex(
      ({ id: findSourceId }) => findSourceId === source.id
    );
    if (indexToUpdate === -1) {
      this.sources.push(source);
    } else {
      this.sources[indexToUpdate] = source;
    }
    return source;
  }
}
