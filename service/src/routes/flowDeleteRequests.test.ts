import { describe, expect, it } from "vitest";
import { setupApp } from "../setupApp";
import request from "supertest";
import { FlowDeleteRequestMother } from "../api/models/flowDeleteRequest.body.mother";
import { inject, reset } from "../di";
import { flowDeleteRequestsRepositoryToken } from "../repository";
import { Config } from "configParser";
import { registerConfig, registerMemoryInfra } from "registerInfra";

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
});
