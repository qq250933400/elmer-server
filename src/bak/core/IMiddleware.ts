import "reflect-metadata";
import { Express } from "express";

export interface IMiddleware {
    use(app: Express): void;
}
