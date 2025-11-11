import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiFlowMother } from '@tams-k8s/api';
import { setupTest } from '../helper';
import { RepoFlowMother } from '../repository/flows.mother';

describe('flows route tests', () => {
    describe('list flows tests', () => {
        it('returns the list of flows', async () => {
            const { repositories, app } = setupTest();

            repositories.withFlows([
                RepoFlowMother.video().build()
            ]);

            const response = await request(app).get('/flows');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([
                ApiFlowMother.video().build(),
            ]);
        });
    });

    describe('get flow tests', () => {
        it('returns a flow', async () => {
            const { repositories, app } = setupTest();
            const flow = RepoFlowMother.video().build();
            repositories.withFlows([flow]);

            const response = await request(app).get(`/flows/${flow.flowId}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(ApiFlowMother.video().build());
        });

        it('returns an error if flow does not exist', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([RepoFlowMother.video().build()]);

            const response = await request(app).get(`/flows/06752034-9268-45c9-9c59-52e4c2f73dc8`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'Not found: Flow could not be found',
                type: 'not_found'
            });
        });

        it('returns validation error if flowId is not uuid', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([RepoFlowMother.video().build()]);

            const response = await request(app).get(`/flows/not-uuid`);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'ValidationError: "flowId" must be a valid GUID',
                type: 'validation_error',
                where: 'params'
            });
        });
    });

    describe('put flow tests', () => {
        afterEach(() => {
            vi.useRealTimers();
        });

        it('create a flow', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([RepoFlowMother.video().build()]);

            const flowToCreate = ApiFlowMother.video().withId('7cd39468-3777-4a76-a71f-cd5c53b9cb67').build();

            const now = new Date();
            vi.useFakeTimers({ now });

            const response = await request(app).put(`/flows/${flowToCreate.id}`).send(flowToCreate);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                ...flowToCreate,
                created: now.toISOString(),
                metadata_updated: now.toISOString(),
            });
            expect(repositories.getInternalFlows().length).toBe(2);
        });

        it('updates an existing flow', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([RepoFlowMother.video().build()]);
            const flowToUpdate = ApiFlowMother.video().withCodec('video/example').build();

            const now = new Date();
            vi.useFakeTimers({ now });

            const response = await request(app).put(`/flows/${flowToUpdate.id}`).send(flowToUpdate);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                ...flowToUpdate,
                created: now.toISOString(),
                metadata_updated: now.toISOString(),
            });
            expect(repositories.getInternalFlows().length).toBe(1);
            expect(repositories.getInternalFlows()).toMatchObject([
                RepoFlowMother.video().withCodec('video/example').build(),
            ]);
        });

        it('does not update a readonly flow', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([RepoFlowMother.video().withReadOnly(true).build()]);
            const flowToUpdate = ApiFlowMother.video().withReadOnly(true).withCodec('video/example').build();

            const response = await request(app).put(`/flows/${flowToUpdate.id}`).send(flowToUpdate);

            expect(response.status).toBe(403);
            expect(response.body).toEqual({
                message: 'Forbidden: Flow is in read only mode',
                type: 'forbidden'
            });
            expect(repositories.getInternalFlows().length).toBe(1);
            expect(repositories.getInternalFlows()).toMatchObject([
                RepoFlowMother.video().withCodec('video/mp4').build(),
            ]);
        });

        it('does update and set readonly flow', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([RepoFlowMother.video().build()]);
            const flowToUpdate = ApiFlowMother.video().withReadOnly(true).withCodec('video/example').build();

            const now = new Date();
            vi.useFakeTimers({ now });

            const response = await request(app).put(`/flows/${flowToUpdate.id}`).send(flowToUpdate);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                ...flowToUpdate,
                created: now.toISOString(),
                metadata_updated: now.toISOString(),
            });
            expect(repositories.getInternalFlows().length).toBe(1);
            expect(repositories.getInternalFlows()).toMatchObject([
                RepoFlowMother.video().withCodec('video/example').build(),
            ]);
        });
    });
});
