import {
  Source as ApiSource,
  SourceCollectionItem as ApiSourceCollectionItem,
} from "@tams-k8s/api";
import {
  Source as RepositorySource,
  SourceCollectionItem as RepositorySourceCollectionItem,
} from "../source";

export class SourceAdapter {
  // fromAPI
  private static fromCollectionItemApi(
    collectionItem: ApiSourceCollectionItem
  ): RepositorySourceCollectionItem {
    return {
      id: collectionItem.id,
      role: collectionItem.role,
    };
  }

  private static fromSourceApi(source: ApiSource): RepositorySource {
    return {
      id: source.id,
      format: source.format,
      label: source.label,
      description: source.description,
      createdBy: source.created_by,
      updatedBy: source.updated_by,
      created: source.created,
      updated: source.updated,
      tags: source.tags,
      sourceCollection: source.source_collection?.map(
        this.fromCollectionItemApi
      ),
      collectedBy: source.collected_by,
    };
  }

  static fromApi(source: ApiSource): RepositorySource {
    return this.fromSourceApi(source);
  }

  // toAPI
  private static toApiCollectionItem(
    collectionItem: RepositorySourceCollectionItem
  ): ApiSourceCollectionItem {
    return { id: collectionItem.id, role: collectionItem.role };
  }

  private static toApiSource(source: RepositorySource): ApiSource {
    return {
      id: source.id,
      format: source.format,
      label: source.label,
      description: source.description,
      created_by: source.createdBy,
      updated_by: source.updatedBy,
      created: source.created,
      updated: source.updated,
      tags: source.tags,
      source_collection: source.sourceCollection?.map(this.toApiCollectionItem),
      collected_by: source.collectedBy,
    };
  }

  static toApi(source: RepositorySource): ApiSource {
    return this.toApiSource(source);
  }
}
