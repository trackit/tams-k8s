import { beforeAll, describe, expect, test } from "vitest";
import { RepositoriesBuilder } from "../builder";
import { BackendManager } from "../../backend/manager";
import { setUpApp } from "../../setUpApp";
import request from "supertest";
import { FormatUrn, Source, SourceMother } from "@tams-k8s/api";
import { SourceRepository } from "repository/source";

const setUp = () => {
  const repository = new RepositoriesBuilder({ type: "memory" });
  const app = setUpApp(
    repository,
    new BackendManager([{ type: "memory", id: "memory", default: true }])
  );
  return {
    app,
    sourceRepository: repository.getSourceRepository(),
  };
};

describe("Testing Sources routes using memory repository", () => {
  let app: any;
  let sourceRepository: SourceRepository;

  beforeAll(() => {
    const setup = setUp();
    app = setup.app;
    sourceRepository = setup.sourceRepository;
  });

  test("should return an empty list if no source is found", async () => {
    const response = await request(app).get("/sources");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  describe("all sources", () => {
    let s1: Source;
    let s2: Source;
    let s3: Source;

    beforeAll(async () => {
      s1 = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withFormat(FormatUrn.IMAGE)
        .withLabel("camera-1")
        .withTags({ tag: "test" })
        .build();
      s2 = SourceMother.created()
        .withId("22222222-2222-2222-2222-222222222222")
        .withFormat(FormatUrn.VIDEO)
        .withTags({ key: "value1", tag: "test" })
        .build();
      s3 = SourceMother.created()
        .withId("33333333-3333-3333-3333-333333333333")
        .withTags({ key: ["value1", "value2"] })
        .build();

      await sourceRepository.putSource(s1);
      await sourceRepository.putSource(s2);
      await sourceRepository.putSource(s3);
    });

    test("should return all sources", async () => {
      const response = await request(app).get("/sources");
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
    });

    test("should filter by label", async () => {
      const response = await request(app).get("/sources?label=camera-1");
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe("11111111-1111-1111-1111-111111111111");
    });

    test("should filter by format", async () => {
      const response = await request(app).get(
        "/sources?format=urn:x-nmos:format:video"
      );
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe("22222222-2222-2222-2222-222222222222");
    });

    test("should filter by tag", async () => {
      const response = await request(app).get("/sources?tag.key=value1");
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe("22222222-2222-2222-2222-222222222222");
      expect(response.body[1].id).toBe("33333333-3333-3333-3333-333333333333");
    });

    test("should filter correctly using haveTags and doesNotHaveTags", async () => {
      const response = await request(app).get(
        "/sources?tag_exists.tag=true&tag_exists.key=false"
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe("11111111-1111-1111-1111-111111111111");
    });

    test("should filter with combined: format + tag", async () => {
      const response = await request(app).get(
        "/sources?format=urn:x-nmos:format:video&tag.key=value1"
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe("22222222-2222-2222-2222-222222222222");
    });

    test("should return only {limit} sources and NextKey should point to correct source", async () => {
      const firstPage = await request(app).get("/sources?limit=2");

      expect(firstPage.status).toBe(200);
      expect(firstPage.body).toHaveLength(2);
      expect(firstPage.body[0].id).toBe("11111111-1111-1111-1111-111111111111");
      expect(firstPage.body[1].id).toBe("22222222-2222-2222-2222-222222222222");
      expect(Number(firstPage.headers["x-paging-limit"])).toBe(2);

      const nextKey = firstPage.headers["x-paging-nextkey"];
      expect(nextKey).toBeDefined();
      expect(typeof nextKey).toBe("string");

      const expectedToken = Buffer.from(
        "22222222-2222-2222-2222-222222222222",
        "utf8"
      ).toString("base64url");

      expect(nextKey).toBe(expectedToken);

      const link = firstPage.headers["link"];
      expect(link).toBeDefined();
      expect(link).toContain('rel="next"');
      expect(link).toContain(encodeURIComponent(expectedToken));

      const secondPage = await request(app).get(
        `/sources?page=${encodeURIComponent(nextKey)}&limit=2`
      );

      expect(secondPage.status).toBe(200);
      expect(secondPage.body).toHaveLength(1);
      expect(secondPage.body[0].id).toBe(
        "33333333-3333-3333-3333-333333333333"
      );

      expect(secondPage.headers["x-paging-nextkey"]).toBeUndefined();
    });

    test("should return 400 for invalid page token", async () => {
      const response = await request(app).get("/sources?page=%%%INVALID%%%");

      expect(response.status).toBe(400);
    });
  });

  describe("source by id", () => {
    test("should return status code 404 if source doesn't exist", async () => {
      const response = await request(app).get(
        "/sources/fcbef7e2-a6b2-486d-8f4e-a408504afcf9"
      );

      expect(response.status).toBe(404);
    });

    test("should return the source if present", async () => {
      await sourceRepository.putSource(
        SourceMother.created()
          .withId("11111111-1111-1111-1111-111111111111")
          .withFormat(FormatUrn.VIDEO)
          .build()
      );
      const response = await request(app).get(
        "/sources/11111111-1111-1111-1111-111111111111"
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: "11111111-1111-1111-1111-111111111111",
        format: "urn:x-nmos:format:video",
      });
    });
  });

  describe("source descriptions", () => {
    let s1: Source;

    beforeAll(async () => {
      s1 = SourceMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withDescription("Description for testing purpose")
        .build();
      await sourceRepository.putSource(s1);
    });

    test("should return 404 if the requested source doesn't exist", async () => {
      const response = await request(app).get(
        "/sources/00000000-0000-0000-0000-000000000000/description"
      );

      expect(response.status).toBe(404);
    });

    test("should return the description if the requested source exist", async () => {
      const response = await request(app).get(
        "/sources/11111111-1111-1111-1111-111111111111/description"
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual("Description for testing purpose");
    });

    test("should update the description of the requested source", async () => {
      const newDescription = { value: "Updated description for testing" };
      const response = await request(app)
        .put(`/sources/11111111-1111-1111-1111-111111111111/description`)
        .send(newDescription);

      expect(response.status).toBe(204);
      const updated = await sourceRepository.getSourceById(
        "11111111-1111-1111-1111-111111111111"
      );
      expect(updated?.description).toBe("Updated description for testing");
    });

    test("should delete the description of the requested source", async () => {
      const response = await request(app).delete(
        `/sources/11111111-1111-1111-1111-111111111111/description`
      );
      expect(response.status).toBe(204);

      const updated = await sourceRepository.getSourceById(
        "11111111-1111-1111-1111-111111111111"
      );
      expect(updated?.description).toBe(undefined);
    });
  });

  //   describe("source labels", () => {});

  //   describe("source tags", () => {});
});
