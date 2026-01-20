import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import { FlowDeleteRequestMother } from "../../api/models/flowDeleteRequest.body.mother";
import { clearDynamoTable, DynamoDBTestContainer } from "../../utils";
import { FlowDeleteRequestsRepository } from "../../repository";
import {
  DDBFlowDeleteRequestsRepository,
  FlowDeleteRequestTableNameToken,
} from "./flowDeleteRequests";
import { inject, register } from "../../di";
import { dynamodbClientToken } from "./client";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const setup = async (endpoint: string) => {
  register(FlowDeleteRequestTableNameToken, {
    useValue: "flowDeleteRequest_table",
  });
  register(dynamodbClientToken, {
    useFactory: () => {
      return new DynamoDBClient({ endpoint: endpoint, region: "us-west-2" });
    },
  });

  const repository = new DDBFlowDeleteRequestsRepository();
  await repository.createTable();

  return repository;
};

describe("Testing DynamoDB repository", () => {
  let dynamoContainer: DynamoDBTestContainer;
  let dynamoEndpoint: string;
  let flowDeleteRequestRepository: FlowDeleteRequestsRepository;

  beforeAll(async () => {
    dynamoContainer = new DynamoDBTestContainer();
    dynamoEndpoint = await dynamoContainer.start();
    flowDeleteRequestRepository = await setup(dynamoEndpoint);
  }, 300000);

  beforeEach(async () => {
    await clearDynamoTable(
      inject(FlowDeleteRequestTableNameToken),
      "us-west-2",
      dynamoEndpoint
    );
  });

  afterAll(async () => {
    if (dynamoContainer) await dynamoContainer.stop();
  });

  describe("all flowDeleteRequest", () => {
    test("should return an empty list if no delete-request is found", async () => {
      const response =
        await flowDeleteRequestRepository.listFlowDeleteRequest();

      expect(response).toEqual([]);
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

      const response =
        await flowDeleteRequestRepository.listFlowDeleteRequest();

      expect(response).toHaveLength(2);
      expect(response).toEqual(
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
    test("should return null if delete-request doesn't exist", async () => {
      const response =
        await flowDeleteRequestRepository.getFlowDeleteRequestById(
          "fcbef7e2-a6b2-486d-8f4e-a408504afcf9"
        );

      expect(response).toBe(null);
    });

    test("should return the flowDeleteRequest if present", async () => {
      await flowDeleteRequestRepository.saveFlowDeleteRequest(
        FlowDeleteRequestMother.created()
          .withId("fcbef7e2-a6b2-486d-8f4e-a408504afcf9")
          .withTimerangeToDelete("0:0_")
          .build()
      );

      const response =
        await flowDeleteRequestRepository.getFlowDeleteRequestById(
          "fcbef7e2-a6b2-486d-8f4e-a408504afcf9"
        );

      expect(response).toMatchObject({
        id: "fcbef7e2-a6b2-486d-8f4e-a408504afcf9",
        status: "created",
        timerangeToDelete: "0:0_",
      });
    });
  });
});
