import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import { RepositoriesBuilder } from "../builder";
import { BackendManager } from "../../backend/manager";
import { setUpApp } from "../../setUpApp";
import request from "supertest";
import { FlowDeleteRequestMother } from "api/models/flowDeleteRequest.body.mother";
import { clearDynamoTable, DynamoDBTestContainer } from "utils";
import { FlowDeleteRequestsRepository } from "repository/flowDeleteRequests";

const setUp = async (endpoint: string) => {
  const repository = new RepositoriesBuilder({
    type: "dynamodb",
    flowTableName: "k8s-tams-test",
    serviceTableName: "k8s-tams-test-service",
    sourceTableName: "k8s-tams-test-source",
    mediaObjectTableName: "k8s-tams-test-media-object",
    flowDeleteRequestsTableName: "k8s-tams-test-flow-delete-requests",
    region: "us-west-2",
    endpoint: endpoint,
  });
  const app = setUpApp(
    repository,
    new BackendManager([{ type: "memory", id: "memory", default: true }])
  );
  await repository.initialize();

  return {
    app,
    flowDeleteRequestRepository: repository.getFlowDeleteRequestsRepository(),
  };
};

describe("Testing using DynamoDB repository", () => {
  let dynamoContainer: DynamoDBTestContainer;
  let dynamoEndpoint: string;
  let app: any;
  let flowDeleteRequestRepository: FlowDeleteRequestsRepository;

  beforeAll(async () => {
    dynamoContainer = new DynamoDBTestContainer();
    dynamoEndpoint = await dynamoContainer.start();

    const setup = await setUp(dynamoEndpoint);
    app = setup.app;
    flowDeleteRequestRepository = setup.flowDeleteRequestRepository;
  }, 300000);

  beforeEach(async () => {
    await clearDynamoTable(
      "k8s-tams-test-flow-delete-requests",
      "us-west-2",
      dynamoEndpoint
    );
  });

  afterAll(async () => {
    if (dynamoContainer) await dynamoContainer.stop();
  });

  describe("all flowDeleteRequest", () => {
    test("should return an empty list if no delete-request is found", async () => {
      const response = await request(app).get("/flow-delete-requests");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test("should return at least one stored delete-requests", async () => {
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
      const response = await request(app).get(
        "/flow-delete-requests/fcbef7e2-a6b2-486d-8f4e-a408504afcf9"
      );
      expect(response.status).toBe(404);
    });

    test("should return the flowDeleteRequest if present", async () => {
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
