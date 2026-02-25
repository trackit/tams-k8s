import { describe, expect, it } from "vitest";
import { setupApp } from "../utils/setupApp";
import request from "supertest";
import { FormatUrn, SourceMother } from "@tams-k8s/api";
import { inject, reset } from "../di";
import { sourceRepositoryToken } from "../repository";
import { registerConfig, registerMemoryInfra } from "../utils/registerInfra";
import { Config } from "../configParser";

const setup = () => {
  reset();
  registerConfig({
    database: { type: "memory" },
    backends: [{ type: "memory", id: "memory", default: true }],
  } as Config);
  registerMemoryInfra();

  const app = setupApp();
  return {
    app,
    sourceRepository: inject(sourceRepositoryToken),
  };
};

describe("Testing Sources routes using memory repository", () => {
  it("should return an empty list if no source is found", async () => {
    const { app } = setup();
    const response = await request(app).get("/sources");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  describe("all sources", () => {
    it("should return all sources", async () => {
      const { app, sourceRepository } = setup();
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

      const response = await request(app).get("/sources");
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
    });

    it("should filter by label", async () => {
      const { app, sourceRepository } = setup();
      const s1 = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withFormat(FormatUrn.IMAGE)
        .withLabel("camera-1")
        .withTags({ tag: "test" })
        .build();
      const s2 = SourceMother.created()
        .withId("22222222-2222-2222-2222-222222222222")
        .withFormat(FormatUrn.VIDEO)
        .withLabel("other-label")
        .build();

      await sourceRepository.putSource(s1);
      await sourceRepository.putSource(s2);

      const response = await request(app).get("/sources?label=camera-1");
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe("11111111-1111-1111-1111-111111111111");
    });

    it("should filter by format", async () => {
      const { app, sourceRepository } = setup();
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

      const response = await request(app).get("/sources?format=urn:x-nmos:format:video");
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe("22222222-2222-2222-2222-222222222222");
    });

    it("should filter by tag", async () => {
      const { app, sourceRepository } = setup();
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

      const response = await request(app).get("/sources?tag.key=value1");
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe("22222222-2222-2222-2222-222222222222");
      expect(response.body[1].id).toBe("33333333-3333-3333-3333-333333333333");
    });

    it("should filter correctly using haveTags and doesNotHaveTags", async () => {
      const { app, sourceRepository } = setup();
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

      const response = await request(app).get("/sources?tag_exists.tag=true&tag_exists.key=false");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe("11111111-1111-1111-1111-111111111111");
    });

    it("should filter with combined: format + tag", async () => {
      const { app, sourceRepository } = setup();
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

      const response = await request(app).get(
        "/sources?format=urn:x-nmos:format:video&tag.key=value1",
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe("22222222-2222-2222-2222-222222222222");
    });

    it("should return only {limit} sources and NextKey should point to correct source", async () => {
      const { app, sourceRepository } = setup();
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

      const firstPage = await request(app).get("/sources?limit=2");

      expect(firstPage.status).toBe(200);
      expect(firstPage.body).toHaveLength(2);
      expect(firstPage.body[0].id).toBe("11111111-1111-1111-1111-111111111111");
      expect(firstPage.body[1].id).toBe("22222222-2222-2222-2222-222222222222");
      expect(Number(firstPage.headers["x-paging-limit"])).toBe(2);

      const nextKey = firstPage.headers["x-paging-nextkey"];
      expect(nextKey).toBeDefined();
      expect(typeof nextKey).toBe("string");

      const expectedToken = Buffer.from("22222222-2222-2222-2222-222222222222", "utf8").toString(
        "base64url",
      );

      expect(nextKey).toBe(expectedToken);

      const link = firstPage.headers["link"];
      expect(link).toBeDefined();
      expect(link).toContain('rel="next"');
      expect(link).toContain(encodeURIComponent(expectedToken));

      const secondPage = await request(app).get(
        `/sources?page=${encodeURIComponent(nextKey)}&limit=2`,
      );

      expect(secondPage.status).toBe(200);
      expect(secondPage.body).toHaveLength(1);
      expect(secondPage.body[0].id).toBe("33333333-3333-3333-3333-333333333333");

      expect(secondPage.headers["x-paging-nextkey"]).toBeUndefined();
    });

    it("should return 400 for invalid page token", async () => {
      const { app } = setup();
      const response = await request(app).get("/sources?page=%%%INVALID%%%");

      expect(response.status).toBe(400);
    });
  });

  describe("source by id", () => {
    it("should return status code 404 if source doesn't exist", async () => {
      const { app } = setup();
      const response = await request(app).get("/sources/fcbef7e2-a6b2-486d-8f4e-a408504afcf9");

      expect(response.status).toBe(404);
    });

    it("should return the source if present", async () => {
      const { app, sourceRepository } = setup();
      await sourceRepository.putSource(
        SourceMother.created()
          .withId("11111111-1111-1111-1111-111111111111")
          .withFormat(FormatUrn.VIDEO)
          .build(),
      );
      const response = await request(app).get("/sources/11111111-1111-1111-1111-111111111111");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: "11111111-1111-1111-1111-111111111111",
        format: "urn:x-nmos:format:video",
      });
    });
  });

  describe("source descriptions", () => {
    it("should return 404 if the requested source doesn't exist", async () => {
      const { app } = setup();
      const response = await request(app).get(
        "/sources/00000000-0000-0000-0000-000000000000/description",
      );

      expect(response.status).toBe(404);
    });

    it("should return the description of the requested source", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withDescription("Description for testing purpose")
        .build();
      await sourceRepository.putSource(source);

      const response = await request(app).get(
        "/sources/11111111-1111-1111-1111-111111111111/description",
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual("Description for testing purpose");
    });

    it("should update the description of the requested source", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withDescription("Original description")
        .build();
      await sourceRepository.putSource(source);

      const newDescription = { value: "Updated description for testing" };
      const response = await request(app)
        .put(`/sources/11111111-1111-1111-1111-111111111111/description`)
        .send(newDescription);

      expect(response.status).toBe(204);
      const updated = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(updated?.description).toBe("Updated description for testing");
    });

    it("should delete the description of the requested source", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withDescription("Description to be deleted")
        .build();
      await sourceRepository.putSource(source);

      const response = await request(app).delete(
        `/sources/11111111-1111-1111-1111-111111111111/description`,
      );
      expect(response.status).toBe(204);

      const updated = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(updated?.description).toBe(undefined);
    });
  });

  describe("source label", () => {
    it("should return 404 if the requested source doesn't exist", async () => {
      const { app } = setup();
      const response = await request(app).get(
        "/sources/00000000-0000-0000-0000-000000000000/label",
      );

      expect(response.status).toBe(404);
    });

    it("should return the label of the requested source", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withLabel("Testing")
        .build();
      await sourceRepository.putSource(source);

      const response = await request(app).get(
        "/sources/11111111-1111-1111-1111-111111111111/label",
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual("Testing");
    });

    it("should update the label of the requested source", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withLabel("Original label")
        .build();
      await sourceRepository.putSource(source);

      const newLabel = { value: "Updated label" };
      const response = await request(app)
        .put(`/sources/11111111-1111-1111-1111-111111111111/label`)
        .send(newLabel);

      expect(response.status).toBe(204);
      const updated = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(updated?.label).toBe("Updated label");
    });

    it("should delete the label of the requested source", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withLabel("Label to be deleted")
        .build();
      await sourceRepository.putSource(source);

      const response = await request(app).delete(
        `/sources/11111111-1111-1111-1111-111111111111/label`,
      );
      expect(response.status).toBe(204);

      const updated = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(updated?.label).toBe(undefined);
    });

    it("should return 404 if the requested source doesn't have a label", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withLabel(undefined)
        .build();
      await sourceRepository.putSource(source);

      const response = await request(app).get(
        "/sources/11111111-1111-1111-1111-111111111111/label",
      );

      expect(response.status).toBe(404);
    });
  });

  describe("source tags", () => {
    it("should return 404 if the requested source doesn't exist", async () => {
      const { app } = setup();
      const response = await request(app).get("/sources/00000000-0000-0000-0000-000000000000/tags");

      expect(response.status).toBe(404);
    });

    it("should return the tags of the requested source", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ key: ["value1", "value2"], tag: "test" })
        .build();
      await sourceRepository.putSource(source);

      const response = await request(app).get("/sources/11111111-1111-1111-1111-111111111111/tags");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ key: ["value1", "value2"], tag: "test" });
    });

    it("should return the value of a specific tag for string", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ key: ["value1", "value2"], tag: "test" })
        .build();
      await sourceRepository.putSource(source);

      const response = await request(app).get(
        "/sources/11111111-1111-1111-1111-111111111111/tags/tag",
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual("test");
    });

    it("should return the value of a specific tag for array of string", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ key: ["value1", "value2"], tag: "test" })
        .build();
      await sourceRepository.putSource(source);

      const response = await request(app).get(
        "/sources/11111111-1111-1111-1111-111111111111/tags/key",
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(["value1", "value2"]);
    });

    it("should return 404 if the value of a specific tag doesn't exist", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ key: ["value1", "value2"], tag: "test" })
        .build();
      await sourceRepository.putSource(source);

      const response = await request(app).get(
        "/sources/11111111-1111-1111-1111-111111111111/tags/unknow",
      );

      expect(response.status).toBe(404);
    });

    it("should create the tag for the requested source", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ key: ["value1", "value2"], tag: "test" })
        .build();
      await sourceRepository.putSource(source);

      const newTag = { value: "newTag" };
      const response = await request(app)
        .put(`/sources/11111111-1111-1111-1111-111111111111/tags/new`)
        .send(newTag);

      expect(response.status).toBe(204);
      const updated = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(updated?.tags?.new).toBe("newTag");
    });

    it("should update the tag of the requested source", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ existing: "original" })
        .build();
      await sourceRepository.putSource(source);

      const newTag = { value: "updated" };
      const response = await request(app)
        .put(`/sources/11111111-1111-1111-1111-111111111111/tags/existing`)
        .send(newTag);

      expect(response.status).toBe(204);
      const updated = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(updated?.tags?.existing).toBe("updated");
    });

    it("should delete the tag of the requested source", async () => {
      const { app, sourceRepository } = setup();
      const source = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTags({ key: ["value1", "value2"], tag: "test" })
        .build();
      await sourceRepository.putSource(source);

      const response = await request(app).delete(
        `/sources/11111111-1111-1111-1111-111111111111/tags/tag`,
      );
      expect(response.status).toBe(204);

      const updated = await sourceRepository.getSourceById("11111111-1111-1111-1111-111111111111");
      expect(updated?.tags?.tag).toBe(undefined);
    });
  });
});
