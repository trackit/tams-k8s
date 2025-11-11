import express, { Router } from "express";
import { BackendManager } from "../backend/manager";
import { RepositoriesBuilder } from "../repository/builder";
import { Factory } from '../repository/factory';

export class Routes {
    protected readonly route: Router;
    protected readonly repositories: Factory;
    protected readonly backends: BackendManager;

    constructor(repositories: Factory, backends: BackendManager) {
        this.repositories = repositories;
        this.backends = backends;
        this.route = express.Router({
            mergeParams: true,
        });
    }

    getRoutes() {
        return this.route;
    }
}
