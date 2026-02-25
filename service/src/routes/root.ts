import { Request, Response } from "express";
import { Routes } from "./generic";

export class RootRoutes extends Routes {
  constructor() {
    super();

    this.route.get("/", this.get.bind(this));
  }

  private get(_: Request, res: Response) {
    res.json(["service", "flows", "sources", "flow-delete-requests"]);
  }
}
