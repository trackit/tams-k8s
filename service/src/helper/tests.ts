import { BackendManager } from '../backend/manager';
import { RepositoriesBuilder } from '../repository/builder';

export const setupTest = (): [RepositoriesBuilder, BackendManager] => {
    const repositories = new RepositoriesBuilder({ type: 'memory' });
    const backend = new BackendManager([{ id: 'test', bucketName: 'test', type: 's3', default: true }]);
    return [repositories, backend];
}
