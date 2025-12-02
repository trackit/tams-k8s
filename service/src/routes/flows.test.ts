import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ApiFlowMother, FormatUrn } from "@tams-k8s/api";
import { RepoFlowMother } from "../repository/flows.mother";
import { inject, reset } from "../di";
import { registerConfig, registerMemoryInfra } from "../registerInfra";
import { Config } from "../configParser";
import { setupApp } from "../setupApp";
import { Flow, FlowRepository, flowRepositoryToken } from "../repository";
import { FlowAdapter } from "../repository/adapters/flow.adapter";

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
    flowRepository: inject(flowRepositoryToken),
  };
};

describe("Testing Flows routes using memory repository", () => {
  let flowRepository: FlowRepository;
  let app: any;
  let flows: Flow[] = [];

  beforeAll(() => {
    ({ app, flowRepository } = setup());
  });

  describe("list flows tests", () => {
    beforeAll(async () => {
      flows = [
        // Basic flows for list and source_id filter tests
        RepoFlowMother.video("f2a4dd5f-8f3c-4a7c-9a29-9fd65a5b9c4e")
          .withSourceId("0588c040-3b1a-4424-9146-6d4f33ce05cb")
          .build(),
        // Audio flow for format filter test
        RepoFlowMother.audio("518f14c2-f940-4035-86ae-a34c16d47b3d").build(),
        // Flows for codec filter test
        RepoFlowMother.video("4f411a83-130e-48ea-b239-b1c32f8d9d2f")
          .withCodec("video/avc1")
          .build(),
        // Flows for tag non existence filter test
        RepoFlowMother.video("00000000-0000-0000-0000-000000000000")
          .withTags({ nowanted: "yes" })
          .build(),
        RepoFlowMother.video("83db8654-ffe1-4e6a-926b-2e7dc7dcb62a")
          .withTags({ other: "no" })
          .build(),
        RepoFlowMother.video("056e7808-9548-4fd9-9792-30a3437951c9")
          .withTags({ anotherOne: "no" })
          .build(),
        // Flows for frame_width filter test
        RepoFlowMother.video("44ce8583-b7ea-4b44-a1cf-c458214de5c7")
          .withFrameWidth(800)
          .build(),
        // Flows for frame_height filter test
        RepoFlowMother.video("c2d3e4f5-a6b7-8901-cdef-123456789012")
          .withFrameHeight(1250)
          .build(),
        RepoFlowMother.video("d3e4f5a6-b7c8-9012-def0-234567890123").build(),
        // Flows for exclusive filters test
        RepoFlowMother.video("b825cf23-f0a1-4cb4-8e40-73964902a0fe")
          .withSourceId("9ff9c8d3-c1c2-428f-a270-ec1b6811249f")
          .build(),
        RepoFlowMother.audio("f2c717e8-0d11-47bb-b1ef-30719e756694").build(),
        RepoFlowMother.video("e4f5a6b7-c8d9-0123-ef01-345678901234")
          .withVideoEssenceParameters({
            frameWidth: 800,
            frameHeight: 600,
          })
          .build(),
        RepoFlowMother.video("f5a6b7c8-d9e0-1234-f012-456789012345")
          .withVideoEssenceParameters({
            frameWidth: 1000,
            frameHeight: 1200,
          })
          .build(),
      ];
      for (const flow of flows) await flowRepository.putFlow(flow);
    });

    it("should return the list of flows", async () => {
      const response = await request(app).get("/flows");

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(flows.length);
    });

    it("should filter the list of flows by source_id", async () => {
      const response = await request(app).get(
        "/flows?source_id=0588c040-3b1a-4424-9146-6d4f33ce05cb"
      );

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe("f2a4dd5f-8f3c-4a7c-9a29-9fd65a5b9c4e");
    });

    it("should filter the list of flows by format type", async () => {
      const response = await request(app).get(
        `/flows?format=${FormatUrn.AUDIO}`
      );

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].format).toBe(FormatUrn.AUDIO);
    });

    it("should filter the list of flows by codec type", async () => {
      const response = await request(app).get(`/flows?codec=video/avc1`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe("4f411a83-130e-48ea-b239-b1c32f8d9d2f");
    });

    it("should filter the list of flows by label type", async () => {
      const flows = [
        RepoFlowMother.video("44ce8583-b7ea-4b44-a1cf-c458214de5c7")
          .withLabel("video-label")
          .build(),
        RepoFlowMother.video("4f411a83-130e-48ea-b239-b1c32f8d9d2f")
          .withLabel("test-label")
          .build(),
      ];
      for (const flow of flows) await flowRepository.putFlow(flow);

      const response = await request(app).get(`/flows?label=test-label`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe("4f411a83-130e-48ea-b239-b1c32f8d9d2f");
    });

    it("should filter the list of flows by tag value", async () => {
      const flows = [
        RepoFlowMother.video("81d881d8-da95-47e4-a033-90e86302b808")
          .withTags({ test: "yes" })
          .build(),
        RepoFlowMother.video("83db8654-ffe1-4e6a-926b-2e7dc7dcb62a")
          .withTags({ test: "no" })
          .build(),
      ];
      for (const flow of flows) await flowRepository.putFlow(flow);

      const response = await request(app).get(`/flows?tag.test=yes`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe("81d881d8-da95-47e4-a033-90e86302b808");
    });

    it("should filter the list of flows by tag existence", async () => {
      const flows = [
        RepoFlowMother.video("81d881d8-da95-47e4-a033-90e86302b808")
          .withTags({ test: "yes" })
          .build(),
        RepoFlowMother.video("83db8654-ffe1-4e6a-926b-2e7dc7dcb62a")
          .withTags({ other: "no" })
          .build(),
      ];
      for (const flow of flows) await flowRepository.putFlow(flow);

      const response = await request(app).get(`/flows?tag_exists.test=true`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe("81d881d8-da95-47e4-a033-90e86302b808");
    });

    it("should filter the list of flows by tag non existence", async () => {
      const response = await request(app).get(
        `/flows?tag_exists.nowanted=false`
      );

      expect(response.status).toBe(200);
      expect(response.body.map(({ id }: { id: string }) => id)).not.toContain(
        "00000000-0000-0000-0000-000000000000"
      );
    });

    it("should filter the list of flows by frame_width", async () => {
      const response = await request(app).get(`/flows?frame_width=1000`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe("f5a6b7c8-d9e0-1234-f012-456789012345");
    });

    it("should filter the list of flows by frame_height", async () => {
      const response = await request(app).get(`/flows?frame_height=1250`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe("c2d3e4f5-a6b7-8901-cdef-123456789012");
    });

    it("should ensure the filters are all exclusive", async () => {
      const response = await request(app).get(
        `/flows?source_id=9ff9c8d3-c1c2-428f-a270-ec1b6811249f&format=${FormatUrn.AUDIO}&codec=video/avc1&label=test-label&tag.test=yes&tag_exists.test=true&frame_width=800&frame_height=1200`
      );

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    });

    it("should paginate result", async () => {
      const page1 = await request(app).get(`/flows?limit=2`);

      // check page 1 results
      expect(page1.status).toBe(200);
      expect(page1.body.length).toBe(2);
      expect(page1.body.map(({ id }: { id: string }) => id)).toEqual([
        "f2a4dd5f-8f3c-4a7c-9a29-9fd65a5b9c4e",
        "518f14c2-f940-4035-86ae-a34c16d47b3d",
      ]);
      expect(page1.headers["x-paging-limit"]).toBe("2");

      const nextKey = page1.headers["x-paging-nextkey"];
      const page2 = await request(app).get(
        `/flows?limit=2&page=${nextKey}`
      );
      // check page 2 results
      expect(page2.status).toBe(200);
      expect(page2.body.length).toBe(2);
      expect(page2.body.map(({ id }: { id: string }) => id)).toEqual([
        "4f411a83-130e-48ea-b239-b1c32f8d9d2f",
        "00000000-0000-0000-0000-000000000000",
      ]);
      expect(page2.headers["x-paging-limit"]).toBe("2");
    });

    it("should return an error if the provided page token is invalid", async () => {
      const response = await request(app).get(
        `/flows?limit=2&page=invalid-token`
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message:
          "Bad request: InvalidPageTokenError: the provided page token is invalid.",
        type: "bad_request",
      });
    });

    it("should return a validation error if filters are invalid", async () => {
      const response = await request(app).get(`/flows?unknown=test`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'ValidationError: "unknown" is not allowed',
        type: "validation_error",
        where: "query",
      });
    });
  });

  describe("get flow tests", () => {
    let flow: Flow;

    beforeAll(async () => {
      flow = RepoFlowMother.video().build();
      await flowRepository.putFlow(flow);
    });

    it("should return a flow", async () => {
      const response = await request(app).get(`/flows/${flow.flowId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(FlowAdapter.toApi(flow));
    });

    it("should return an error if flow does not exist", async () => {
      const response = await request(app).get(
        `/flows/06752034-9268-45c9-9c59-52e4c2f73dc8`
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: "Not found: Flow could not be found",
        type: "not_found",
      });
    });

    it("should return validation error if flowId is not uuid", async () => {
      const response = await request(app).get(`/flows/not-uuid`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'ValidationError: "flowId" must be a valid GUID',
        type: "validation_error",
        where: "params",
      });
    });
  });

  describe("put flow tests", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("should create a flow", async () => {
      const flowNumber = await flowRepository
        .listFlows()
        .then(({ flows }) => flows.length);
      const flowToCreate = ApiFlowMother.video()
        .withId("7cd39468-3777-4a76-a71f-cd5c53b9cb67")
        .build();

      const now = new Date();
      vi.useFakeTimers({ now });

      const response = await request(app)
        .put(`/flows/${flowToCreate.id}`)
        .send(flowToCreate);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...flowToCreate,
        created: now.toISOString(),
        metadata_updated: now.toISOString(),
      });

      const createdFlowNumber = (await flowRepository.listFlows()).flows.length;
      expect(createdFlowNumber).toBe(flowNumber + 1);
    });

    it("should return a validation error if flowId is not uuid", async () => {
      const flowToCreate = ApiFlowMother.video()
        .withId("7cd39468-3777-4a76-a71f-cd5c53b9cb67")
        .build();

      const response = await request(app)
        .put("/flows/not-uuid")
        .send(flowToCreate);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'ValidationError: "flowId" must be a valid GUID',
        type: "validation_error",
        where: "params",
      });
    });

    it("should return a validation error if flowIds does not match", async () => {
      const flowToCreate = ApiFlowMother.video()
        .withId("7cd39468-3777-4a76-a71f-cd5c53b9cb67")
        .build();

      const response = await request(app)
        .put("/flows/be0edd0c-2099-4b94-8ce9-068479c8788a")
        .send(flowToCreate);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Bad request: flow ID does not match URL parameter",
        type: "bad_request",
      });
    });

    it("should return validation error if flow to update is invalid", async () => {
      const flowToCreate = {
        id: "12fe66eb-bd38-4ed7-b5b9-38c5341f2e8b",
      };

      const response = await request(app)
        .put(`/flows/${flowToCreate.id}`)
        .send(flowToCreate);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message:
          'ValidationError: "source_id" is required. "codec" is required. "format" is required',
        type: "validation_error",
        where: "body",
      });
    });

    it("should update an existing flow", async () => {
      const flow = RepoFlowMother.video().build();
      await flowRepository.putFlow(flow);
      const flowToUpdate = ApiFlowMother.video()
        .withId(flow.flowId)
        .withCodec("video/example")
        .build();

      const now = new Date();
      vi.useFakeTimers({ now });

      const response = await request(app)
        .put(`/flows/${flowToUpdate.id}`)
        .send(flowToUpdate);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...flowToUpdate,
        created: now.toISOString(),
        metadata_updated: now.toISOString(),
      });
      const updatedFlow = await flowRepository.getFlowById(flow.flowId);
      expect(updatedFlow?.codec).toBe("video/example");
    });

    it("should not update a readonly flow", async () => {
      flowRepository.putFlow(RepoFlowMother.video().withReadOnly(true).build());
      const flowToUpdate = ApiFlowMother.video()
        .withReadOnly(true)
        .withCodec("video/example")
        .build();

      const response = await request(app)
        .put(`/flows/${flowToUpdate.id}`)
        .send(flowToUpdate);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Forbidden: Flow is in read only mode",
        type: "forbidden",
      });
      const flow = await flowRepository.getFlowById(flowToUpdate.id);
      expect(flow?.readOnly).toBe(true);
      expect(flow?.codec).toBe("video/mp4");
    });

    it("should update and set readonly flow", async () => {
      const flow = RepoFlowMother.video().build();
      await flowRepository.putFlow(flow);
      const flowToUpdate = ApiFlowMother.video()
        .withReadOnly(true)
        .withCodec("video/example")
        .build();

      const now = new Date();
      vi.useFakeTimers({ now });

      const response = await request(app)
        .put(`/flows/${flowToUpdate.id}`)
        .send(flowToUpdate);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...flowToUpdate,
        created: now.toISOString(),
        metadata_updated: now.toISOString(),
      });
      const updatedFlow = await flowRepository.getFlowById(flow.flowId);
      expect(updatedFlow?.readOnly).toBe(true);
      expect(updatedFlow?.codec).toBe("video/example");
    });
  });
});
