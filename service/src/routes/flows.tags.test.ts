import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { setupTest } from '../helper';
import { RepoFlowMother } from '../repository/flows.mother';

describe('flows tags routes tests', () => {
    describe('list flow tags test', () => {
       it('list the tags for a flow', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('d610e75b-9d6c-4579-b34a-c341475dc7e2').withTags({
                    test: 'ok',
                    another: 'yes'
                }).build()
            ]);

            const response = await request(app).get('/flows/d610e75b-9d6c-4579-b34a-c341475dc7e2/tags');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                test: 'ok',
                another: 'yes'
            });
       });

        it('does not list the tags for a non existing flow', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('d610e75b-9d6c-4579-b34a-c341475dc7e2').withTags({
                    test: 'ok',
                    another: 'yes'
                }).build()
            ]);

            const response = await request(app).get('/flows/d0017616-3659-4009-86a9-2195f04060a0/tags');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'Not found: Flow could not be found',
                type: 'not_found'
            });
        });

        it('returns a validation error if path is not valid uuid', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('d610e75b-9d6c-4579-b34a-c341475dc7e2').withTags({
                    test: 'ok',
                    another: 'yes'
                }).build()
            ]);

            const response = await request(app).get('/flows/not-uuid/tags');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'ValidationError: "flowId" must be a valid GUID',
                type: 'validation_error',
                where: 'params'
            });
        });
    });

    describe('get one tag for a flow test', () => {
        it('returns the tag for a flow', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('d610e75b-9d6c-4579-b34a-c341475dc7e2').withTags({
                    test: 'ok',
                    another: 'yes'
                }).build()
            ]);

            const response = await request(app).get('/flows/d610e75b-9d6c-4579-b34a-c341475dc7e2/tags/test');

            expect(response.status).toBe(200);
            expect(response.body).toEqual('ok');
        });

        it('returns an error if the flow does not exist', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('d610e75b-9d6c-4579-b34a-c341475dc7e2').withTags({
                    test: 'ok',
                    another: 'yes'
                }).build()
            ]);

            const response = await request(app).get('/flows/81808068-9928-46ca-93cb-dd2d5165d916/tags/test');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'Not found: Flow "81808068-9928-46ca-93cb-dd2d5165d916" could not be found',
                type: 'not_found'
            });
        });

        it('returns an error if the tag does not exist', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('d610e75b-9d6c-4579-b34a-c341475dc7e2').withTags({
                    test: 'ok',
                    another: 'yes'
                }).build()
            ]);

            const response = await request(app).get('/flows/d610e75b-9d6c-4579-b34a-c341475dc7e2/tags/non-existing');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'Not found: Tag "non-existing" could not be found',
                type: 'not_found'
            });
        });

        it('returns a validation error if path is not a valid uuid', async () => {
            const { repositories, app } = setupTest();
            repositories.withFlows([
                RepoFlowMother.video('d610e75b-9d6c-4579-b34a-c341475dc7e2').withTags({
                    test: 'ok',
                    another: 'yes'
                }).build()
            ]);

            const response = await request(app).get('/flows/non-uuid/tags/test');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'ValidationError: "flowId" must be a valid GUID',
                type: 'validation_error',
                where: 'params'
            });
        });
    });
});
