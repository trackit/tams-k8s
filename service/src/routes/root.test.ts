import { describe, expect, test } from "vitest";
import request from "supertest";
import {
  MemoryFlowDeleteRequestsRepository,
  MemoryServiceRepository,
  MemorySourceRepository,
} from "repository/memory";
import { register, reset } from "di";
import {
  flowDeleteRequestsRepositoryToken,
  sourceRepositoryToken,
  serviceRepositoryToken,
} from "repository";
import { BackendManager } from "backend/manager";
import { setupApp } from "setupApp";
import { RepositoriesBuilder } from "repository/builder";

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
  };
};

describe("Testing Root routes", () => {
  test("should return the list of services", async () => {
    const { app } = setup();
    const response = await request(app).get("/");

    expect(response.status).equal(200);
    expect(response.body).toEqual([
      "service",
      "flows",
      "sources",
      "flow-delete-requests",
    ]);
  });
});
