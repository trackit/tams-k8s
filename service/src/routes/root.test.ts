import { describe, expect, it } from "vitest";
import request from "supertest";
import { reset } from "../di";
import { setupApp } from "../utils/setupApp";
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
  };
};

describe("Testing Root routes", () => {
  it("should return the list of services", async () => {
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
