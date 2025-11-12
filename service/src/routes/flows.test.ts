import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiFlowMother, FormatUrn } from '@tams-k8s/api';
import { setupTest } from '../helper';
import { RepoFlowMother } from '../repository/flows.mother';

describe('flows route tests', () => {
    describe('list flows tests', () => {
        it('returns the list of flows', async () => {
            const { repositories, app } = setupTest();

            repositories.withFlows([
                RepoFlowMother.video().build(),
            ]);

            const response = await request(app).get('/flows');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([
                ApiFlowMother.video().build(),
            ]);
        });

        it('filters the list of flows by source_id', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video().build(),
                RepoFlowMother.video('f2a4dd5f-8f3c-4a7c-9a29-9fd65a5b9c4e').withSourceId('0588c040-3b1a-4424-9146-6d4f33ce05cb').build(),
            ]);

            const response = await request(app).get('/flows?source_id=0588c040-3b1a-4424-9146-6d4f33ce05cb');

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].id).toBe('f2a4dd5f-8f3c-4a7c-9a29-9fd65a5b9c4e');
        });

        it('filters the list of flows by format type', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video().build(),
                RepoFlowMother.audio().build(),
            ]);

            const response = await request(app).get(`/flows?format=${FormatUrn.AUDIO}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].format).toBe(FormatUrn.AUDIO);
        });

        it('filters the list of flows by codec type', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('44ce8583-b7ea-4b44-a1cf-c458214de5c7').build(),
                RepoFlowMother.video('4f411a83-130e-48ea-b239-b1c32f8d9d2f').withCodec('video/avc1').build(),
            ]);

            const response = await request(app).get(`/flows?codec=video/avc1`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].id).toBe('4f411a83-130e-48ea-b239-b1c32f8d9d2f');
        });

        it('filters the list of flows by label type', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('44ce8583-b7ea-4b44-a1cf-c458214de5c7').withLabel('video-label').build(),
                RepoFlowMother.video('4f411a83-130e-48ea-b239-b1c32f8d9d2f').withLabel('test-label').build(),
            ]);

            const response = await request(app).get(`/flows?label=test-label`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].id).toBe('4f411a83-130e-48ea-b239-b1c32f8d9d2f');
        });

        it('filters the list of flows by tag value', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('81d881d8-da95-47e4-a033-90e86302b808').withTags({ test: 'yes' }).build(),
                RepoFlowMother.video('83db8654-ffe1-4e6a-926b-2e7dc7dcb62a').withTags({ test: 'no' }).build(),
            ]);

            const response = await request(app).get(`/flows?tag.test=yes`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].id).toBe('81d881d8-da95-47e4-a033-90e86302b808');
        });

        it('filters the list of flows by tag existence', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('81d881d8-da95-47e4-a033-90e86302b808').withTags({ test: 'yes' }).build(),
                RepoFlowMother.video('83db8654-ffe1-4e6a-926b-2e7dc7dcb62a').withTags({ other: 'no' }).build(),
            ]);

            const response = await request(app).get(`/flows?tag_exists.test=true`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].id).toBe('81d881d8-da95-47e4-a033-90e86302b808');
        });

        it('filters the list of flows by tag non existence', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('81d881d8-da95-47e4-a033-90e86302b808').withTags({ test: 'yes' }).build(),
                RepoFlowMother.video('83db8654-ffe1-4e6a-926b-2e7dc7dcb62a').withTags({ other: 'no' }).build(),
                RepoFlowMother.video('056e7808-9548-4fd9-9792-30a3437951c9').withTags({ anotherOne: 'no' }).build(),
            ]);

            const response = await request(app).get(`/flows?tag_exists.test=false`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
            expect(response.body.map(({ id }: {
                id: string
            }) => id)).toEqual(['83db8654-ffe1-4e6a-926b-2e7dc7dcb62a', '056e7808-9548-4fd9-9792-30a3437951c9']);
        });

        it('filters the list of flows by frame_width', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('44ce8583-b7ea-4b44-a1cf-c458214de5c7').withVideoEssenceParameters({
                    frameWidth: 800,
                    frameHeight: 600,
                }).build(),
                RepoFlowMother.video('4f411a83-130e-48ea-b239-b1c32f8d9d2f').withVideoEssenceParameters({
                    frameWidth: 1000,
                    frameHeight: 1200,
                }).build(),
            ]);

            const response = await request(app).get(`/flows?frame_width=1000`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].id).toBe('4f411a83-130e-48ea-b239-b1c32f8d9d2f');
        });

        it('filters the list of flows by frame_height', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('44ce8583-b7ea-4b44-a1cf-c458214de5c7').withVideoEssenceParameters({
                    frameWidth: 800,
                    frameHeight: 600,
                }).build(),
                RepoFlowMother.video('4f411a83-130e-48ea-b239-b1c32f8d9d2f').withVideoEssenceParameters({
                    frameWidth: 1000,
                    frameHeight: 1200,
                }).build(),
            ]);

            const response = await request(app).get(`/flows?frame_height=1200`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].id).toBe('4f411a83-130e-48ea-b239-b1c32f8d9d2f');
        });

        it('ensure the filters are all exclusive', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('b825cf23-f0a1-4cb4-8e40-73964902a0fe').withSourceId('9ff9c8d3-c1c2-428f-a270-ec1b6811249f').build(),
                RepoFlowMother.audio('f2c717e8-0d11-47bb-b1ef-30719e756694').build(),
                RepoFlowMother.video('719fbf7d-8211-4ff5-a61d-79749c45e9ed').withCodec('video/avc1').build(),
                RepoFlowMother.video('719fbf7d-8211-4ff5-a61d-79749c45e9ed').withLabel('test-label').build(),
                RepoFlowMother.video('719fbf7d-8211-4ff5-a61d-79749c45e9ed').withTags({ test: 'yes' }).build(),
                RepoFlowMother.video('44ce8583-b7ea-4b44-a1cf-c458214de5c7').withVideoEssenceParameters({
                    frameWidth: 800,
                    frameHeight: 600,
                }).build(),
                RepoFlowMother.video('4f411a83-130e-48ea-b239-b1c32f8d9d2f').withVideoEssenceParameters({
                    frameWidth: 1000,
                    frameHeight: 1200,
                }).build(),
            ]);

            const response = await request(app).get(`/flows?source_id=9ff9c8d3-c1c2-428f-a270-ec1b6811249f&format=${FormatUrn.AUDIO}&codec=video/avc1&label=test-label&tag.test=yes&tag_exists.test=true&frame_width=800&frame_height=1200`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(0);
        });

        it('paginate result', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('44ce8583-b7ea-4b44-a1cf-c458214de5c7').build(),
                RepoFlowMother.video('4f411a83-130e-48ea-b239-b1c32f8d9d2f').build(),
                RepoFlowMother.video('37ee5222-4f24-46a9-8dcd-09fc62f40a61').build(),
                RepoFlowMother.video('369b75bd-3dd8-4326-8f76-3e3681bdf8e6').build(),
                RepoFlowMother.video('982638b6-e2fe-4fe4-8222-00d3a5ee0169').build(),
            ]);

            const page1 = await request(app).get(`/flows?limit=2&tag_exists.test=false`);
            const page2 = await request(app).get(`/flows?limit=2&tag_exists.test=false&page=NGY0MTFhODMtMTMwZS00OGVhLWIyMzktYjFjMzJmOGQ5ZDJm`);

            // check page 1 results
            expect(page1.status).toBe(200);
            expect(page1.body.length).toBe(2);
            expect(page1.body.map(({ id }: {
                id: string
            }) => id)).toEqual(['44ce8583-b7ea-4b44-a1cf-c458214de5c7', '4f411a83-130e-48ea-b239-b1c32f8d9d2f']);
            expect(page1.headers['x-paging-limit']).toBe('2');
            expect(page1.headers['x-paging-nextkey']).toBe('NGY0MTFhODMtMTMwZS00OGVhLWIyMzktYjFjMzJmOGQ5ZDJm');
            expect(page1.headers['link']).toMatch('/flows?limit=2&tag_exists.test=false&page=NGY0MTFhODMtMTMwZS00OGVhLWIyMzktYjFjMzJmOGQ5ZDJm>; rel="next"');

            // check page 2 results
            expect(page2.status).toBe(200);
            expect(page2.body.length).toBe(2);
            expect(page2.body.map(({ id }: {
                id: string
            }) => id)).toEqual(['37ee5222-4f24-46a9-8dcd-09fc62f40a61', '369b75bd-3dd8-4326-8f76-3e3681bdf8e6']);
            expect(page2.headers['x-paging-limit']).toBe('2');
            expect(page2.headers['x-paging-nextkey']).toBe('MzY5Yjc1YmQtM2RkOC00MzI2LThmNzYtM2UzNjgxYmRmOGU2');
            expect(page2.headers['link']).toMatch('/flows?limit=2&tag_exists.test=false&page=MzY5Yjc1YmQtM2RkOC00MzI2LThmNzYtM2UzNjgxYmRmOGU2>; rel="next"');
        });

        it('returns an error if the provided page token is invalid', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('44ce8583-b7ea-4b44-a1cf-c458214de5c7').build(),
                RepoFlowMother.video('4f411a83-130e-48ea-b239-b1c32f8d9d2f').build(),
                RepoFlowMother.video('37ee5222-4f24-46a9-8dcd-09fc62f40a61').build(),
            ]);

            const response = await request(app).get(`/flows?limit=2&page=invalid-token`);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Bad request: InvalidPageTokenError: the provided page token is invalid.',
                type: 'bad_request',
            });
        });

        it('returns a validation error if filters are invalid', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('44ce8583-b7ea-4b44-a1cf-c458214de5c7').build(),
                RepoFlowMother.video('4f411a83-130e-48ea-b239-b1c32f8d9d2f').build(),
            ]);

            const response = await request(app).get(`/flows?unknown=test`);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'ValidationError: "unknown" is not allowed',
                type: 'validation_error',
                where: 'query'
            });
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
                type: 'not_found',
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
                where: 'params',
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

        it('returns a validation error if flowId is not uuid', async () => {
            const { app } = setupTest();

            const flowToCreate = ApiFlowMother.video().withId('7cd39468-3777-4a76-a71f-cd5c53b9cb67').build();

            const response = await request(app).put('/flows/not-uuid').send(flowToCreate);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'ValidationError: "flowId" must be a valid GUID',
                type: 'validation_error',
                where: 'params',
            });
        });

        it('returns a validation error if flowIds does not match', async () => {
            const { app } = setupTest();

            const flowToCreate = ApiFlowMother.video().withId('7cd39468-3777-4a76-a71f-cd5c53b9cb67').build();

            const response = await request(app).put('/flows/be0edd0c-2099-4b94-8ce9-068479c8788a').send(flowToCreate);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Bad request: flow ID does not match URL parameter',
                type: 'bad_request',
            });
        });

        it('returns validation error if flow to update is invalid', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([RepoFlowMother.video().build()]);

            const flowToCreate = {
                id: '12fe66eb-bd38-4ed7-b5b9-38c5341f2e8b',
            };

            const response = await request(app).put(`/flows/${flowToCreate.id}`).send(flowToCreate);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'ValidationError: "source_id" is required. "codec" is required. "format" is required',
                type: 'validation_error',
                where: 'body',
            });
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
                type: 'forbidden',
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
