import { Adapter } from "./Adapter";
import { json } from 'body-parser';
import utils from "../../utils/utils";
import express, { Express } from "express";

export class ExpressAdapter extends Adapter {
    private app: Express;
    constructor() {
        super();
        this.app = express();
    }
    public listen() {
        const serverConfig = this.configuration?.Server;
        if(!serverConfig) {
            throw new Error("未正确加载配置信息！");
        }
        if(utils.isEmpty(serverConfig?.staticRoute)) {
            this.app.use(express.static(serverConfig.staticPath));
        } else {
            this.app.use(serverConfig?.staticRoute, express.static(serverConfig.staticPath));
        }
        this.app.on("error", (err) => {
            this.emit("error", err);
        });
        this.app.on("close", () => {
            this.emit("close");
        });
        this.app.on("ready", () => {
            console.log("---Ready---");
        });console.log("listen")
        this.app.listen(serverConfig.port, serverConfig.host, () => {
            this.emit("ready", `http://${serverConfig.host}:${serverConfig.port}`);
        });
    }
}
