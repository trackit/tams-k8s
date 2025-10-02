import express, { Router } from "express";
import { RepositoriesBuilder } from "../repository/builder";

export class Routes {
    protected readonly route: Router;
    protected readonly repositories: RepositoriesBuilder;

    constructor(repositories: RepositoriesBuilder) {
        this.repositories = repositories;
        this.route = express.Router();
    }

    getRoutes() {
        return this.route;
    }
}
