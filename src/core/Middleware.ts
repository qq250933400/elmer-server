import "reflect-metadata";
import { AppService } from "./Module";
import { Express } from "express";
import { CrossOrigin } from "./CrossOrigin";

@AppService
export class Middleware {
    constructor(
        private crossOrigin: CrossOrigin
    ) {

    }
    use(app: Express): void {
        this.crossOrigin.use(app);
    }
}
