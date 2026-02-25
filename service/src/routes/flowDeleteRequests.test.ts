import { describe, expect, it } from "vitest";
import { setupApp } from "../utils/setupApp";
import request from "supertest";
import { FlowDeleteRequestMother } from "../api/models/flowDeleteRequest.body.mother";
import { inject, reset } from "../di";
import { flowDeleteRequestsRepositoryToken } from "../repository";
import { Config } from "../configParser";
import { registerConfig, registerMemoryInfra } from "../utils/registerInfra";

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
    flowDeleteRequestRepository: inject(flowDeleteRequestsRepositoryToken),
  };
};

describe("Testing using memory repository", () => {
  describe("all flowDeleteRequest", () => {
    it("should return an empty list if no delete-request is found", async () => {
      const { app } = setup();
      const response = await request(app).get("/flow-delete-requests");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("should return at least one stored delete-requests", async () => {
      const { app, flowDeleteRequestRepository } = setup();
      const request1 = FlowDeleteRequestMother.created()
        .withId("11111111-1111-1111-1111-111111111111")
        .withTimerangeToDelete("0:10_")
        .build();
      const request2 = FlowDeleteRequestMother.created()
        .withId("22222222-2222-2222-2222-222222222222")
        .withTimerangeToDelete("20:30_")
        .build();
      await flowDeleteRequestRepository.saveFlowDeleteRequest(request1);
      await flowDeleteRequestRepository.saveFlowDeleteRequest(request2);
      const response = await request(app).get("/flow-delete-requests");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "11111111-1111-1111-1111-111111111111",
            timerangeToDelete: "0:10_",
            status: "created",
          }),
          expect.objectContaining({
            id: "22222222-2222-2222-2222-222222222222",
            timerangeToDelete: "20:30_",
            status: "created",
          }),
        ])
      );
    });
  });

  describe("flowDeleteRequest by id", () => {
    it("should return status code 404 if delete-request doesn't exist", async () => {
      const { app } = setup();
      const response = await request(app).get(
        "/flow-delete-requests/fcbef7e2-a6b2-486d-8f4e-a408504afcf9"
      );

      expect(response.status).toBe(404);
    });

    it("should return the flowDeleteRequest if present", async () => {
      const { app, flowDeleteRequestRepository } = setup();
      await flowDeleteRequestRepository.saveFlowDeleteRequest(
        FlowDeleteRequestMother.created()
          .withId("fcbef7e2-a6b2-486d-8f4e-a408504afcf9")
          .withTimerangeToDelete("0:0_")
          .build()
      );
      const response = await request(app).get(
        "/flow-delete-requests/fcbef7e2-a6b2-486d-8f4e-a408504afcf9"
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: "fcbef7e2-a6b2-486d-8f4e-a408504afcf9",
        status: "created",
        timerangeToDelete: "0:0_",
      });
    });
  });

  describe("post flowDeleteRequest", () => {
    it("should create a flow delete request and return 201", async () => {
      const { app } = setup();
      const body = FlowDeleteRequestMother.created()
        .withId("a1b2c3d4-e5f6-4789-a012-345678901234")
        .withFlowId("b2c3d4e5-f6a7-4890-b123-456789012345")
        .withTimerangeToDelete("0:10_")
        .withDeleteFlow(true)
        .build();

      const response = await request(app)
        .post("/flow-delete-requests")
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: "a1b2c3d4-e5f6-4789-a012-345678901234",
        flowId: "b2c3d4e5-f6a7-4890-b123-456789012345",
        timerangeToDelete: "0:10_",
        deleteFlow: true,
        status: "created",
      });
      expect(response.body.created).toBeDefined();
      expect(response.body.updated).toBeDefined();

      const getResponse = await request(app).get(
        "/flow-delete-requests/a1b2c3d4-e5f6-4789-a012-345678901234"
      );
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.id).toBe(body.id);
    });

    it("should return validation error if body is invalid", async () => {
      const { app } = setup();
      const response = await request(app)
        .post("/flow-delete-requests")
        .send({
          id: "not-a-uuid",
          flowId: "b2c3d4e5-f6a7-4890-b123-456789012345",
          timerangeToDelete: "0:10_",
          deleteFlow: false,
          status: "created",
        });

      expect(response.status).toBe(400);
      expect(response.body.type).toBe("validation_error");
      expect(response.body.where).toBe("body");
    });
  });

  describe("delete flowDeleteRequest", () => {
    it("should return 400 if requestId is not a valid UUID", async () => {
      const { app } = setup();
      const response = await request(app).delete(
        "/flow-delete-requests/not-a-valid-uuid"
      );

      expect(response.status).toBe(400);
      expect(response.body.type).toBe("validation_error");
      expect(response.body.where).toBe("params");
    });

    it("should return 404 if delete-request doesn't exist", async () => {
      const { app } = setup();
      const response = await request(app).delete(
        "/flow-delete-requests/fcbef7e2-a6b2-486d-8f4e-a408504afcf9"
      );

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        message: "Not found: Flow delete request not found",
        type: "not_found",
      });
    });

    it("should return 204 and remove the flowDeleteRequest if present", async () => {
      const { app, flowDeleteRequestRepository } = setup();
      await flowDeleteRequestRepository.saveFlowDeleteRequest(
        FlowDeleteRequestMother.created()
          .withId("d4e5f6a7-b8c9-4012-d234-567890123456")
          .withTimerangeToDelete("0:0_")
          .build()
      );

      const response = await request(app).delete(
        "/flow-delete-requests/d4e5f6a7-b8c9-4012-d234-567890123456"
      );

      expect(response.status).toBe(204);

      const getResponse = await request(app).get(
        "/flow-delete-requests/d4e5f6a7-b8c9-4012-d234-567890123456"
      );
      expect(getResponse.status).toBe(404);
    });
  });
});
