import express, { Router } from "express";

export class Routes {
  protected readonly route: Router;

  constructor() {
    this.route = express.Router({
      mergeParams: true,
    });
  }

  getRoutes() {
    return this.route;
  }
}
