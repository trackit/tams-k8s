import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ApiFlowMother } from "../../api";
import { FlowRepository } from "../../repository";
import { clearDynamoTable, DynamoDBTestContainer } from "../../utils";
import { inject, register } from "../../di";
import { DDBFlowsRepository, FlowTableNameToken } from "./flows";
import { dynamodbClientToken } from "./client";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const setup = async (endpoint: string) => {
    register(FlowTableNameToken, { useValue: "flow_table" });
    register(dynamodbClientToken, {
        useFactory: () => {
            return new DynamoDBClient({ endpoint: endpoint, region: "us-west-2" });
        },
    });

    const repository = new DDBFlowsRepository();
    await repository.createTable();

    return repository;
};

describe("Testing Flows DynamoDB repository", () => {
    let dynamoContainer: DynamoDBTestContainer;
    let dynamoEndpoint: string;
    let flowRepository: FlowRepository;

    beforeAll(async () => {
        dynamoContainer = new DynamoDBTestContainer();
        dynamoEndpoint = await dynamoContainer.start();
        flowRepository = await setup(dynamoEndpoint);
    }, 300000);

    beforeEach(async () => {
        await clearDynamoTable(inject(FlowTableNameToken), "us-west-2", dynamoEndpoint);
    });

    afterAll(async () => {
        if (dynamoContainer) await dynamoContainer.stop();
    });

    describe("delete flow", () => {
        it("should return false if flow doesn't exist", async () => {
            const response = await flowRepository.deleteFlow("06752034-9268-45c9-9c59-52e4c2f73dc8");

            expect(response).toBe(false);
        });

        it("should return false if flow is in read only mode", async () => {
            const flow = ApiFlowMother.video().withReadOnly(true).buildRepoFlow();
            await flowRepository.putFlow(flow);

            const response = await flowRepository.deleteFlow(flow.flowId);

            expect(response).toBe(false);
            const currentFlow = await flowRepository.getFlowById(flow.flowId);
            expect(currentFlow).not.toBeNull();
        });

        it("should delete a flow", async () => {
            const flow = ApiFlowMother.video().buildRepoFlow();
            await flowRepository.putFlow(flow);

            const response = await flowRepository.deleteFlow(flow.flowId);

            expect(response).toBe(true);
            const currentFlow = await flowRepository.getFlowById(flow.flowId);
            expect(currentFlow).toBeNull();
        });
    });
});
