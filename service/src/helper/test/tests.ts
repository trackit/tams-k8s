import { Express } from 'express';
import { BackendManager } from '../../backend/manager';
import { TestRepositories } from './repositories';
import { setupApp } from '../../setupApp';

interface TestData {
    repositories: TestRepositories,
    backend: BackendManager,
    app: Express,
}

export const setupTest = (): TestData => {
    const repositories = new TestRepositories();
    const backend = new BackendManager([{ id: 'test', bucketName: 'test', type: 's3', default: true }]);
    const app = setupApp(repositories, backend);
    return {
        repositories,
        backend,
        app
    };
}
