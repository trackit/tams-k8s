import { Request, Response } from "express";
import { RepositoriesBuilder } from "../repository/builder";
import { Routes } from "./generic";

export class FlowsRoutes extends Routes {
    constructor(repositories: RepositoriesBuilder) {
        super(repositories);

        this.route.get('/', this.listFlows.bind(this));
    }

    private async listFlows(req: Request, res: Response) {

    }
}
