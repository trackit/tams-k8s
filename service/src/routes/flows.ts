import { Request, Response } from "express";
import { BackendManager } from "../backend/manager";
import { RepositoriesBuilder } from "../repository/builder";
import { Routes } from "./generic";

export class FlowsRoutes extends Routes {
    constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
        super(repositories, backends);

        this.route.get('/', this.listFlows.bind(this));
    }

    private async listFlows(req: Request, res: Response) {

    }
}
