import { describe, expect, it } from "vitest";
import { setupApp } from "../setupApp";
import request from "supertest";
import { ServiceMother } from "../api/models/service.mother";
import { inject, reset } from "../di";
import { serviceRepositoryToken } from "../repository";
import { registerConfig, registerMemoryInfra } from "../registerInfra";
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
    serviceRepository: inject(serviceRepositoryToken),
  };
};

describe("Testing Service routes using memory repository", () => {
  it("should return the service information", async () => {
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

  it("should update the service information", async () => {
    const { app, serviceRepository } = setup();
    const response = await request(app)
      .post("/service")
      .send({ name: "service", description: "description" });

    const service = await serviceRepository.getService();

    expect(response.status).toBe(204);
    expect(service.name).toBe("service");
    expect(service.description).toBe("description");
  });

  it("should return the storage backends information", async () => {
    const { app } = setup();
    const response = await request(app).get("/service/storage-backends");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
