import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { FormatUrn, SourceMother } from "../../api";
import { SourceRepository } from "../../repository";
import { clearDynamoTable, DynamoDBTestContainer } from "../../utils";
import { inject, register } from "../../di";
import { DDBSourcesRepository, SourceTableNameToken } from "./source";
import { dynamodbClientToken } from "./client";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { InvalidPageTokenError } from "../../repository/errors";

const setup = async (endpoint: string) => {
  register(SourceTableNameToken, { useValue: "source_table" });
  register(dynamodbClientToken, {
    useFactory: () => {
      return new DynamoDBClient({ endpoint: endpoint, region: "us-west-2" });
    },
  });

  const repository = new DDBSourcesRepository();
  await repository.createTable();

  return repository;
};

describe("Testing Sources DynamoDB repository", () => {
  let dynamoContainer: DynamoDBTestContainer;
  let dynamoEndpoint: string;
  let sourceRepository: SourceRepository;

  beforeAll(async () => {
    dynamoContainer = new DynamoDBTestContainer();
    dynamoEndpoint = await dynamoContainer.start();
    sourceRepository = await setup(dynamoEndpoint);
  }, 300000);

  beforeEach(async () => {
    await clearDynamoTable(inject(SourceTableNameToken), "us-west-2", dynamoEndpoint);
  });

  afterAll(async () => {
    if (dynamoContainer) await dynamoContainer.stop();
  });

  test("should return an empty list if no source is found", async () => {
    const response = await sourceRepository.listSources();

    expect(response.sources).toEqual([]);
  });

  describe("all sources", () => {
    test("should return all sources", async () => {
      const s1 = SourceMother.created().withId("11111111-1111-1111-1111-111111111111").build();
      const s2 = SourceMother.created().withId("22222222-2222-2222-2222-222222222222").build();
      const s3 = SourceMother.created().withId("33333333-3333-3333-3333-333333333333").build();

      await sourceRepository.putSource(s1);
      await sourceRepository.putSource(s2);
      await sourceRepository.putSource(s3);

      const response = await sourceRepository.listSources();
      expect(response.sources).toHaveLength(3);
    });

    test("should filter by label", async () => {
      const s1 = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withLabel("camera-1")
        .build();
      const s2 = SourceMother.created()
        .withId("22222222-2222-2222-2222-222222222222")
        .withLabel("other-label")
        .build();

      await sourceRepository.putSource(s1);
      await sourceRepository.putSource(s2);

      const response = await sourceRepository.listSources({
        label: "camera-1",
      });
      expect(response.sources).toHaveLength(1);
      expect(response.sources[0].id).toBe("11111111-1111-1111-1111-111111111111");
    });

    test("should filter by format", async () => {
      const s1 = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withFormat(FormatUrn.IMAGE)
        .build();
      const s2 = SourceMother.created()
        .withId("22222222-2222-2222-2222-222222222222")
        .withFormat(FormatUrn.VIDEO)
        .build();

      await sourceRepository.putSource(s1);
      await sourceRepository.putSource(s2);

      const response = await sourceRepository.listSources({
        format: "urn:x-nmos:format:video",
      });
      expect(response.sources).toHaveLength(1);
      expect(response.sources[0].id).toBe("22222222-2222-2222-2222-222222222222");
    });

    test("should filter by tag", async () => {
      const s1 = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ tag: "test" })
        .build();
      const s2 = SourceMother.created()
        .withId("22222222-2222-2222-2222-222222222222")
        .withTags({ key: "value1", tag: "test" })
        .build();
      const s3 = SourceMother.created()
        .withId("33333333-3333-3333-3333-333333333333")
        .withTags({ key: ["value1", "value2"] })
        .build();

      await sourceRepository.putSource(s1);
      await sourceRepository.putSource(s2);
      await sourceRepository.putSource(s3);

      const response = await sourceRepository.listSources({
        tags: { key: "value1" },
      });
      const ids = response.sources.map((s: any) => s.id);

      expect(ids).toContain("22222222-2222-2222-2222-222222222222");
      expect(ids).toContain("33333333-3333-3333-3333-333333333333");
      expect(ids).toHaveLength(2);
    });

    test("should filter correctly using haveTags and doesNotHaveTags", async () => {
      const s1 = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ tag: "test" })
        .build();
      const s2 = SourceMother.created()
        .withId("22222222-2222-2222-2222-222222222222")
        .withTags({ key: "value1", tag: "test" })
        .build();
      const s3 = SourceMother.created()
        .withId("33333333-3333-3333-3333-333333333333")
        .withTags({ key: ["value1", "value2"] })
        .build();

      await sourceRepository.putSource(s1);
      await sourceRepository.putSource(s2);
      await sourceRepository.putSource(s3);

      const response = await sourceRepository.listSources({
        haveTags: ["tag"],
        doesNotHaveTags: ["key"],
      });

      expect(response.sources).toHaveLength(1);
      expect(response.sources[0].id).toBe("11111111-1111-1111-1111-111111111111");
    });

    test("should filter with combined: format + tag", async () => {
      const s1 = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withFormat(FormatUrn.IMAGE)
        .withTags({ key: "value1" })
        .build();
      const s2 = SourceMother.created()
        .withId("22222222-2222-2222-2222-222222222222")
        .withFormat(FormatUrn.VIDEO)
        .withTags({ key: "value1", tag: "test" })
        .build();
      const s3 = SourceMother.created()
        .withId("33333333-3333-3333-3333-333333333333")
        .withFormat(FormatUrn.VIDEO)
        .withTags({ other: "value" })
        .build();

      await sourceRepository.putSource(s1);
      await sourceRepository.putSource(s2);
      await sourceRepository.putSource(s3);

      const response = await sourceRepository.listSources({
        format: "urn:x-nmos:format:video",
        tags: { key: "value1" },
      });

      expect(response.sources).toHaveLength(1);
      expect(response.sources[0].id).toBe("22222222-2222-2222-2222-222222222222");
    });

    test("should return only {limit} sources and NextKey should point to correct source", async () => {
      const s1 = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withFormat(FormatUrn.IMAGE)
        .withLabel("camera-1")
        .withTags({ tag: "test" })
        .build();
      const s2 = SourceMother.created()
        .withId("22222222-2222-2222-2222-222222222222")
        .withFormat(FormatUrn.VIDEO)
        .withTags({ key: "value1", tag: "test" })
        .build();
      const s3 = SourceMother.created()
        .withId("33333333-3333-3333-3333-333333333333")
        .withTags({ key: ["value1", "value2"] })
        .build();

      await sourceRepository.putSource(s1);
      await sourceRepository.putSource(s2);
      await sourceRepository.putSource(s3);

      const firstPage = await sourceRepository.listSources({ limit: 2 });
      expect(firstPage.sources).toHaveLength(2);

      const firstPageIds = firstPage.sources.map((s: any) => s.id);
      const allSourceIds = [
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222",
        "33333333-3333-3333-3333-333333333333",
      ];
      firstPageIds.forEach((id: string) => {
        expect(allSourceIds).toContain(id);
      });

      expect(Number(firstPage.limit)).toBe(2);
      const nextKey = firstPage.nextPageToken;
      expect(nextKey).toBeDefined();
      expect(typeof nextKey).toBe("string");

      const secondPage = await sourceRepository.listSources({
        page: nextKey,
        limit: 2,
      });

      expect(secondPage.sources).toHaveLength(1);
      const secondPageId = secondPage.sources[0].id;
      expect(firstPageIds).not.toContain(secondPageId);
      expect(allSourceIds).toContain(secondPageId);

      expect(secondPage.nextPageToken).toBeUndefined();
    });

    test("should throw InvalidPageTokenError for invalid page token", async () => {
      await expect(
        sourceRepository.listSources({
          page: "%%%INVALID%%%",
        }),
      ).rejects.toThrow(InvalidPageTokenError);
    });
  });

  describe("source by id", () => {
    test("should return null if source doesn't exist", async () => {
      const response = await sourceRepository.getSourceById("fcbef7e2-a6b2-486d-8f4e-a408504afcf9");

      expect(response).toBeNull();
    });

    test("should return the source if present", async () => {
      await sourceRepository.putSource(
        SourceMother.created()
          .withId("11111111-1111-1111-1111-111111111111")
          .build(),
      );
      const response = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");

      expect(response).toBeDefined();
      expect(response?.id).toBe("11111111-1111-1111-1111-111111111111");
    });
  });

  describe("source descriptions", () => {
    test("should return null if the requested source doesn't exist", async () => {
      const response = await sourceRepository.getSourceById("00000000-0000-0000-0000-000000000000");

      expect(response).toBeNull();
    });

    test("should return the description of the requested source", async () => {
      const s1 = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withDescription("Description for testing purpose")
        .build();
      await sourceRepository.putSource(s1);

      const response = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");

      expect(response?.description).toBe("Description for testing purpose");
    });

    test("should update the description of the requested source", async () => {
      const s1 = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withDescription("Original description")
        .build();
      await sourceRepository.putSource(s1);

      s1.description = "Updated description for testing";
      await sourceRepository.putSource(s1);

      const updated = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(updated?.description).toBe("Updated description for testing");
    });

    test("should delete the description of the requested source", async () => {
      const s1 = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withDescription("Description to be deleted")
        .build();
      await sourceRepository.putSource(s1);

      s1.description = undefined;
      await sourceRepository.putSource(s1);

      const response = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(response?.description).toBeUndefined();
    });
  });

  describe("source label", () => {
    test("should return null if the requested source doesn't exist", async () => {
      const response = await sourceRepository.getSourceById("00000000-0000-0000-0000-000000000000");

      expect(response).toBeNull();
    });

    test("should return the label of the requested source", async () => {
      const s = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withLabel("Testing")
        .build();
      await sourceRepository.putSource(s);

      const response = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");

      expect(response?.label).toBe("Testing");
    });

    test("should update the label of the requested source", async () => {
      const s = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withLabel("Original label")
        .build();
      await sourceRepository.putSource(s);

      s.label = "Updated label";
      await sourceRepository.putSource(s);

      const updated = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(updated?.label).toBe("Updated label");
    });

    test("should delete the label of the requested source", async () => {
      const s = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withLabel("Label to be deleted")
        .build();
      await sourceRepository.putSource(s);

      s.label = undefined;
      await sourceRepository.putSource(s);

      const response = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(response?.label).toBeUndefined();
    });

    test("should return undefined if the requested source doesn't have a label", async () => {
      const s = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withLabel(undefined)
        .build();
      await sourceRepository.putSource(s);

      const response = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");

      expect(response?.label).toBeUndefined();
    });
  });

  describe("source tags", () => {
    test("should return null if the requested source doesn't exist", async () => {
      const response = await sourceRepository.getSourceById("00000000-0000-0000-0000-000000000000");

      expect(response).toBeNull();
    });

    test("should return the tags of the requested source", async () => {
      const s = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ key: ["value1", "value2"], tag: "test" })
        .build();
      await sourceRepository.putSource(s);

      const response = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");

      expect(response?.tags).toEqual({
        key: ["value1", "value2"],
        tag: "test",
      });
    });

    test("should return the value of a specific tag for string", async () => {
      const s = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ key: ["value1", "value2"], tag: "test" })
        .build();
      await sourceRepository.putSource(s);

      const response = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");

      expect(response?.tags?.tag).toBe("test");
    });

    test("should return the value of a specific tag for array of string", async () => {
      const s = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ key: ["value1", "value2"], tag: "test" })
        .build();
      await sourceRepository.putSource(s);

      const response = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");

      expect(response?.tags?.key).toEqual(["value1", "value2"]);
    });

    test("should return undefined if the value of a specific tag doesn't exist", async () => {
      const s = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ key: ["value1", "value2"], tag: "test" })
        .build();
      await sourceRepository.putSource(s);

      const response = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");

      expect(response?.tags?.unknown).toBeUndefined();
    });

    test("should create the tag for the requested source", async () => {
      const s = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ key: ["value1", "value2"], tag: "test" })
        .build();
      await sourceRepository.putSource(s);

      s.tags = { ...s.tags, new: "newTag" };
      await sourceRepository.putSource(s);

      const updated = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(updated?.tags?.new).toBe("newTag");
    });

    test("should update the tag of the requested source", async () => {
      const s = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ existing: "original" })
        .build();
      await sourceRepository.putSource(s);

      s.tags = { ...s.tags, existing: "updated" };
      await sourceRepository.putSource(s);

      const updated = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(updated?.tags?.existing).toBe("updated");
    });

    test("should delete the tag of the requested source", async () => {
      const s = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ key: ["value1", "value2"], tag: "test" })
        .build();
      await sourceRepository.putSource(s);

      s.tags = { key: ["value1", "value2"] };
      await sourceRepository.putSource(s);

      const updated = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(updated?.tags?.tag).toBe(undefined);
    });
  });
});
