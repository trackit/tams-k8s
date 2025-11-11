import { BackendManager } from '../../backend/manager';
import { TestRepositories } from './repositories';

export const setupTest = (): [TestRepositories, BackendManager] => {
    const repositories = new TestRepositories();
    const backend = new BackendManager([{ id: 'test', bucketName: 'test', type: 's3', default: true }]);
    return [repositories, backend];
}
