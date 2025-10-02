import express, { Router } from "express";
import { BackendManager } from "../backend/manager";
import { RepositoriesBuilder } from "../repository/builder";

export class Routes {
    protected readonly route: Router;
    protected readonly repositories: RepositoriesBuilder;
    protected readonly backends: BackendManager;

    constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
        this.repositories = repositories;
        this.backends = backends;
        this.route = express.Router();
    }

    getRoutes() {
        return this.route;
    }
}
