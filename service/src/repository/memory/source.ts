import type { ListSourcesFilters, Source, SourceRepository } from "../source";

export class MemorySourceImpl implements SourceRepository {
  private readonly sources: Source[];

  constructor() {
    this.sources = [];
  }

  async listSources(filters?: ListSourcesFilters): Promise<Source[]> {
    let result = [...this.sources];

    if (filters) {
      const { format, label, tags, haveTags, doesNotHaveTags, page, limit } =
        filters;

      if (format) {
        result = result.filter((s) => s.format === format);
      }

      if (label) {
        const lowerLabel = label.toLowerCase();
        result = result.filter((s) =>
          s.label?.toLowerCase().includes(lowerLabel)
        );
      }

      if (tags) {
        result = result.filter((s) =>
          Object.entries(tags).every(([key, value]) => s.tags?.[key] === value)
        );
      }

      if (haveTags && haveTags.length > 0) {
        result = result.filter((s) =>
          haveTags.every((key) => s.tags && key in s.tags)
        );
      }

      if (doesNotHaveTags && doesNotHaveTags.length > 0) {
        result = result.filter(
          (s) => !doesNotHaveTags.some((key) => s.tags && key in s.tags)
        );
      }

      if (limit && Number(limit) > 0) {
        const p = Number(page) > 0 ? Number(page) : 1;
        const start = (p - 1) * Number(limit);
        result = result.slice(start, start + Number(limit));
      }
    }

    return result;
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
