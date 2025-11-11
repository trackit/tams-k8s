import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ApiFlowMother } from '@tams-k8s/api';
import { setupTest } from '../helper';
import { setupExpressApp } from '../index';
import { RepoFlowMother } from '../repository/flows.mother';

describe('flows route tests', () => {
    it('returns the list of flows', async () => {
        const [repositories, backends] = setupTest();
        const app = setupExpressApp(repositories, backends);

        repositories.withFlows([
            RepoFlowMother.video().build()
        ]);

        const response = await request(app).get('/flows');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            ApiFlowMother.video().build(),
        ]);
    })
})
