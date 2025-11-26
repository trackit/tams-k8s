import { describe, expect, test } from "vitest";
import { RepositoriesBuilder } from "../repository/builder";
import { BackendManager } from "../backend/manager";
import { setUpApp } from "../setUpApp";
import request from "supertest";
import { FlowDeleteRequestMother } from "../api/models/flowDeleteRequest.body.mother";
import { inject, register, reset } from "../di";
import {
  flowDeleteRequestsRepositoryToken,
  serviceRepositoryToken,
  sourceRepositoryToken,
} from "../repository";
import {
  MemoryFlowDeleteRequestsRepository,
  MemoryServiceRepository,
  MemorySourceRepository,
} from "../repository/memory";
import { registerInfra } from "registerInfra";

const registerTestInfrastructure = () => {
  register(flowDeleteRequestsRepositoryToken, {
    useClass: MemoryFlowDeleteRequestsRepository,
  });

  register(sourceRepositoryToken, {
    useClass: MemorySourceRepository,
  });

  register(serviceRepositoryToken, {
    useClass: MemoryServiceRepository,
  });
};

const setup = () => {
  reset();
  registerTestInfrastructure();

  // TODO: Remove after SetupApp refacto
  const app = setUpApp(
    new RepositoriesBuilder({ type: "memory" }),
    new BackendManager([{ type: "memory", id: "memory", default: true }])
  );
  return {
    app,
    flowDeleteRequestRepository: inject(flowDeleteRequestsRepositoryToken),
  };
};

describe("Testing using memory repository", () => {
  describe("all flowDeleteRequest", () => {
    test("should return an empty list if no delete-request is found", async () => {
      const { app } = setup();
      const response = await request(app).get("/flow-delete-requests");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test("should return at least one stored delete-requests", async () => {
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
    test("should return status code 404 if delete-request doesn't exist", async () => {
      const { app } = setup();
      const response = await request(app).get(
        "/flow-delete-requests/fcbef7e2-a6b2-486d-8f4e-a408504afcf9"
      );

      expect(response.status).toBe(404);
    });

    test("should return the flowDeleteRequest if present", async () => {
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
