import express, { Router, Request, Response } from "express";
import { RepositoriesBuilder } from "../repository/builder";
import { Routes } from "./generic";

export class RootRoutes extends Routes {
    constructor(repositories: RepositoriesBuilder) {
        super(repositories);

        this.route.get('/', this.get.bind(this));
    }

    private get(_: Request, res: Response) {
        res.json([
            // "service",
            "flows",
            // "sources",
            // "flow-delete-requests"
        ]);
    }
}
