import "reflect-metadata";
import { AppService, GetInstanceId } from "../core/Module";
import { Express, Request, Response } from "express";
import { GetConfig, IConfigSession, IConfigServer } from "../config";
import { StaticFiles } from "../utils/StaticFiles";
import { GetLogger, Logger } from "../logs";
import { utils } from "elmer-common";
import * as cookieParser from "cookie-parser";
import * as path from "path";
import com from "../utils/utils";

@AppService
export class Session {

    @GetConfig("Session")
    private config: IConfigSession;
    @GetConfig("Server")
    private sevConfig: IConfigServer;
    @GetInstanceId
    private instanceId: string;
    @GetLogger
    private logger: Logger;

    private savePath: string;
    private publicKey: string;
    constructor(
        private fileObj: StaticFiles
    ) {}
    init(app: Express): void {
        app.use(cookieParser());
        if(this.config.enabled) {
            this.configCheck();
            app.use((req: Request, res: Response, next: Function) => {
                this.sessionState(req, res);
                next();
            });
        }
    }
    private sessionState(req: Request, res: Response): void {
        let NODE_SESSION_ID = (req.cookies || {}).NODE_SESSION_ID;
        if(utils.isEmpty(NODE_SESSION_ID)) {
            NODE_SESSION_ID = "SESSION_" + utils.guid();
            const sessionFile = path.resolve(this.savePath, "./" + NODE_SESSION_ID);
            const sessionData = JSON.stringify({
                dateTime: Date.now(),
                data: {}
            });
            if(this.config.encode) {
                this.fileObj.writeFile(sessionFile, com.aseEncode(sessionData, this.publicKey));
            } else {
                this.fileObj.writeFile(sessionFile, sessionData);
            }
            res.cookie("NODE_SESSION_ID", NODE_SESSION_ID, {
                "secure": true,
                "httpOnly": true,
                "maxAge": this.config.timeout || 7200
            });
            this.logger.info("Init session");
        }

    }
    private configCheck(): void {
        const publicKey = utils.isEmpty(this.config.publicKey) ? this.sevConfig.publicKey : this.config.publicKey;
        this.savePath = path.resolve(this.config.savePath, "./" + this.instanceId);
        this.fileObj.checkDir(this.config.savePath, process.cwd());
        this.fileObj.checkDir(this.savePath, process.cwd());
        this.publicKey = publicKey;
        this.logger.info("Start Session")
        if(this.config.encode && utils.isEmpty(publicKey)) {
            throw new Error('启用session加密选项必须设置publicKey');
        }
    }
}