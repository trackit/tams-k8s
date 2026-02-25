import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { ServiceRepository } from "../../repository";
import { DynamoDBTestContainer } from "../../utils";
import { register } from "../../di";
import { DDBServiceRepository, ServiceTableNameToken } from "./service";
import { dynamodbClientToken } from "./client";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const setup = async (endpoint: string) => {
  register(ServiceTableNameToken, { useValue: "service_table" });
  register(dynamodbClientToken, {
    useFactory: () => {
      return new DynamoDBClient({ endpoint: endpoint, region: "us-west-2" });
    },
  });

  const repository = new DDBServiceRepository();
  await repository.createTable();

  return repository;
};

describe("Testing Service DynamoDB repository", () => {
  let dynamoContainer: DynamoDBTestContainer;
  let dynamoEndpoint: string;
  let serviceRepository: ServiceRepository;

  beforeAll(async () => {
    dynamoContainer = new DynamoDBTestContainer();
    dynamoEndpoint = await dynamoContainer.start();
    serviceRepository = await setup(dynamoEndpoint);
  }, 300000);

  afterAll(async () => {
    if (dynamoContainer) await dynamoContainer.stop();
  });

  test("should return service information", async () => {
    const service = await serviceRepository.getService();

    expect(service.name).toBe("");
    expect(service.description).toBe("");
  });

  test("should update service information", async () => {
    await serviceRepository.updateService({
      name: "service",
      description: "description",
    });
    const service = await serviceRepository.getService();
    expect(service.name).toBe("service");
    expect(service.description).toBe("description");
  });
});
