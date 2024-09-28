import { Express } from "express";
import { IConfigServer } from "../config/IConfigServer";
import { GetConfig } from "../config";

export abstract class ServerAdapter<IServerApp extends Express> {
    @GetConfig("Server")
    public readonly config: IConfigServer;

    public abstract httpApp: IServerApp;
    public abstract listen();
    public abstract use<T extends Function>(handler: T): void;
    public abstract use<T extends Function>(pathname: string, handler: T);
}


class TestAdapter extends ServerAdapter<Express> {
    public httpApp: Express;
    public listen() {
        this.httpApp.listen(this.config.port, this.config.host);
    }
    public use<T extends Function>(handler: T): void;
    public use<T extends Function>(pathname: string, handler: T);
    public use(pathname: unknown, handler?: unknown): any {
        throw new Error("Method not implemented.");
    }
}