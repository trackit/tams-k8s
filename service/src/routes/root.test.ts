import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { setupTest } from '../helper';
import { setupExpressApp } from '../index';

describe('root routes tests', () => {
    it('returns the list of services', async () => {
        const [repositories, backend] = setupTest();
        const app = setupExpressApp(repositories, backend);

        const response = await request(app).get('/');

        expect(response.status).equal(200);
        expect(response.body).toEqual(['service', 'flows'])
    });
});
