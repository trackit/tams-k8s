import { Source, FormatUrn } from "@tams-k8s/api";

export class SourceMother {
  private source: Source;

  static created(): SourceMother {
    return new SourceMother({
      id: "00000000-0000-0000-0000-000000000000",
      format: FormatUrn.AUDIO,
      label: "default-label",
      description: "default-description",
      created_by: "tester",
      updated_by: "tester",
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tags: {},
      source_collection: [],
      collected_by: [],
    });
  }

  constructor(source: Source) {
    this.source = source;
  }

  build(): Source {
    return this.source;
  }

  withId(id: string): SourceMother {
    this.source.id = id;
    return this;
  }

  withFormat(format: FormatUrn): SourceMother {
    this.source.format = format;
    return this;
  }

  withLabel(label: string): SourceMother {
    this.source.label = label;
    return this;
  }

  withDescription(description: string): SourceMother {
    this.source.description = description;
    return this;
  }

  withCreatedBy(user: string): SourceMother {
    this.source.created_by = user;
    return this;
  }

  withUpdatedBy(user: string): SourceMother {
    this.source.updated_by = user;
    return this;
  }

  withCreated(date: string | Date): SourceMother {
    this.source.created = date;
    return this;
  }

  withUpdated(date: string | Date): SourceMother {
    this.source.updated = date;
    return this;
  }

  withTags(tags: Record<string, string | string[]>): SourceMother {
    this.source.tags = tags;
    return this;
  }

  withSourceCollection(
    collection: { id: string; role: string }[]
  ): SourceMother {
    this.source.source_collection = collection;
    return this;
  }

  withCollectedBy(users: string[]): SourceMother {
    this.source.collected_by = users;
    return this;
  }
}
