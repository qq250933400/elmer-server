import "reflect-metadata";
import { AppService, GetInstanceId } from "../core/Module";
import { Express, Request, Response } from "express";
import { GetConfig, IConfigSession, IConfigServer } from "../config";
import { StaticFiles } from "../utils/StaticFiles";
import { GetLogger, Logger } from "../logs";
import { utils } from "elmer-common";
import * as cookieParser from "cookie-parser";
import * as path from "path";
import * as fs from "fs";
import com from "../utils/utils";

@AppService
export class SessionService {

    @GetConfig("Session")
    private config: IConfigSession;
    @GetConfig("Server")
    private sevConfig: IConfigServer;
    @GetInstanceId
    private instanceId: string;
    @GetLogger
    private logger: Logger;

    public savePath: string;

    private publicKey: string;
    private sessionMap: any = {};
    constructor(
        private fileObj: StaticFiles
    ) {}
    init(app: Express): void {
        app.use(cookieParser());
        this.clearSession(this.config?.savePath);
        if(this.config?.enabled) {
            this.configCheck();
            app.use((req: Request, res: Response, next: Function) => {
                this.sessionState(req, res);
                next();
            });
        }
    }
    registe(req: Request, reqId: string): void {
        const sessionId: string = req.cookies.NODE_SESSION_ID;
        if(!this.sessionMap[sessionId]) {
            this.sessionMap[sessionId] = [];
        }
        this.sessionMap[sessionId].push(reqId);
    }
    unRegiste(reqId: string): void {
        Object.keys(this.sessionMap).forEach((ssid: string) => {
            const ssmap: string[] = this.sessionMap[ssid] || [];
            const ssIndex = ssmap.indexOf(reqId);
            if(ssIndex >= 0) {
                ssmap.splice(ssIndex, 1);
                this.sessionMap[ssid] = ssmap;
            }
        });
    }
    read(reqId: string): any {
        const ssKeys = Object.keys(this.sessionMap);
        let userSessionId: string = null;
        for(const ssid of ssKeys) {
            const mapData: string[] = this.sessionMap[ssid];
            if(mapData.indexOf(reqId) >= 0) {
                userSessionId = ssid;
                break;
            }
        }
        if(utils.isEmpty(userSessionId)) {
            return null;
        } else {
            const fileName = "./" + userSessionId + ".session";
            const sessionFile = path.resolve(this.savePath, fileName);
            if(fs.existsSync(sessionFile)) {
                const sessionText = fs.readFileSync(sessionFile, "utf-8");
                const dataText = this.config.encode ? com.aseDecode(sessionText, this.publicKey) : sessionText;
                return JSON.parse(dataText);
            } else {
                return null;
            }
        }
    }
    save(reqId: string, data: any): void {
        const saveData = {
            dateTime: Date.now(),
            data
        };
        const ssKeys = Object.keys(this.sessionMap);
        let userSessionId: string = null;
        for(const ssid of ssKeys) {
            const mapData: string[] = this.sessionMap[ssid];
            if(mapData.indexOf(reqId) >= 0) {
                userSessionId = ssid;
                break;
            }
        }
        if(utils.isEmpty(userSessionId)) {
            throw new Error(`Can not save data to session store, please check your configuration and make sure the session service is enabled.`);
        } else {
            const fileName = "./" + userSessionId + ".session";
            const sessionFile = path.resolve(this.savePath, fileName);
            const sessionText = this.config.encode ? com.aseEncode(JSON.stringify(saveData), this.publicKey) : JSON.stringify(saveData);
            this.fileObj.writeFile(sessionFile, sessionText, {
                encoding: "utf-8"
            });
        }
    }
    private clearSession(savePath: string): void {
        this.logger.info("Clear session cache.");
        const files = this.fileObj.readDirSync(savePath);
        for(const name of files) {
            const fileName = path.resolve(savePath, "./" + name);
            try{
                const lInfo = fs.lstatSync(fileName);
                if(lInfo.isDirectory()) {
                    this.clearSession(fileName);
                    fs.rmdirSync(fileName);
                } else {
                    fs.unlinkSync(fileName);
                }
            } catch(e) {
                this.logger.debug('Delete: ', fileName);
                this.logger.error(e.message);
            }
        }
    }
    private sessionState(req: Request, res: Response): void {
        let NODE_SESSION_ID = (req.cookies || {}).NODE_SESSION_ID;
        if(utils.isEmpty(NODE_SESSION_ID)) {
            NODE_SESSION_ID = "SESSION_" + utils.guid();
            const fileName = "./" + NODE_SESSION_ID + ".session";
            const sessionFile = path.resolve(this.savePath, fileName);
            const sessionData = JSON.stringify({
                dateTime: Date.now(),
                data: {}
            });
            const origin = (req.headers["origin"] || "")
                .replace(/^http[s]{0,1}\:\/\//i, "").replace(/\:[\d]*$/, "");
            const host = req.get("host").replace(/\:[\d]*$/, "");
            if(this.config.encode) {
                this.fileObj.writeFile(sessionFile, com.aseEncode(sessionData, this.publicKey));
            } else {
                this.fileObj.writeFile(sessionFile, sessionData);
            }
            res.cookie("NODE_SESSION_ID", NODE_SESSION_ID, {
                "secure": true,
                "httpOnly": true,
                "maxAge": this.config.timeout || 7200000,
                "domain": origin.length > 0 && origin !== host ? [origin, host].join(",") : host,
                "sameSite": "none"
            });
            req.cookies.NODE_SESSION_ID = NODE_SESSION_ID;
            this.logger.info("Init session", this.config.timeout);
        }
        return NODE_SESSION_ID;
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