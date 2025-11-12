import { Express } from 'express';
import { BackendManager } from '../../backend/manager';
import { setupExpressApp } from '../../setupApp';
import { TestRepositories } from './repositories';

interface TestData {
    repositories: TestRepositories,
    backend: BackendManager,
    app: Express,
}

export const setupTest = (): TestData => {
    const repositories = new TestRepositories();
    const backend = new BackendManager([{ id: 'test', bucketName: 'test', type: 's3', default: true }]);
    const app = setupExpressApp(repositories, backend);
    return {
        repositories,
        backend,
        app
    };
}
