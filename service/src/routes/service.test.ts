import { describe, expect, test } from "vitest";
import { RepositoriesBuilder } from "../repository/builder";
import { BackendManager } from "../backend/manager";
import { setupApp } from "../setupApp";
import request from "supertest";
import { ServiceMother } from "../api/models/service.mother";
import { inject, register, reset } from "../di";
import {
  flowDeleteRequestsRepositoryToken,
  sourceRepositoryToken,
  serviceRepositoryToken,
} from "../repository";
import {
  MemoryFlowDeleteRequestsRepository,
  MemoryServiceRepository,
  MemorySourceRepository,
} from "../repository/memory";

const registerTestInfrastructure = () => {
  register(flowDeleteRequestsRepositoryToken, {
    useValue: new MemoryFlowDeleteRequestsRepository(),
  });

  register(sourceRepositoryToken, {
    useValue: new MemorySourceRepository(),
  });

  register(serviceRepositoryToken, {
    useValue: new MemoryServiceRepository(),
  });
};

const setup = () => {
  reset();
  registerTestInfrastructure();

  // TODO: Remove after SetupApp refacto
  const app = setupApp(
    new RepositoriesBuilder({ type: "memory" }),
    new BackendManager([{ type: "memory", id: "memory", default: true }])
  );
  return {
    app,
    serviceRepository: inject(serviceRepositoryToken),
  };
};

describe("Testing Service routes using memory repository", () => {
  test("should return the service information", async () => {
    const { app } = setup();
    const response = await request(app).get("/service");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      ServiceMother.created()
        .withName("")
        .withDescription("")
        .withType("urn:x-tams:service.example")
        .withApiVersion("1.0")
        .withServiceVersion("tams.7.0-b831a15")
        .withEventStreamMechanisms([])
        .build()
    );
  });

  test("should update the service information", async () => {
    const { app, serviceRepository } = setup();
    const response = await request(app)
      .post("/service")
      .send({ name: "service", description: "description" });

    const service = await serviceRepository.getService();

    expect(response.status).toBe(204);
    expect(service.name).toBe("service");
    expect(service.description).toBe("description");
  });

  test("should return the storage backends information", async () => {
    const { app } = setup();
    const response = await request(app).get("/service/storage-backends");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
