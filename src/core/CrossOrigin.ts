import "reflect-metadata";
import { AppService } from "./Module";
import { IMiddleware } from "./IMiddleware";
import { Express, Request, Response } from "express";
import { GetConfig, IConfigCrossSite, IConfigServer } from "../config";
import { GetLogger, Logger } from "../logs";

@AppService
export class CrossOrigin implements IMiddleware {
    @GetConfig("Security")
    private config: IConfigCrossSite;

    @GetConfig("Server")
    private serConfig: IConfigServer;

    @GetLogger
    private logger: Logger;

    use(app: Express): void {
        app.use("*", (req: Request, res: Response, next: Function) => {
            const method = req.method;
            const isOptions = method.toUpperCase() === "OPTIONS";
            const origin = req.headers["origin"];
            const host =  req.protocol + "://" + req.hostname;
            if(
                ((
                    this.config.enabled === undefined ||
                    this.config.enabled === null
                ) || this.config.enabled) &&
                origin !== host &&
                /^http[s]{0,1}:\/\//i.test(origin)
            ) {
                const domainRules = this.config.rules || [];
               
                this.logger.debug("Cross origin configuration checking: ");
                this.logger.debug("  Origin: ", origin);
                this.logger.debug("  host: ", host);
                this.logger.debug("  url : ", `${host}${req.originalUrl}`);
                this.logger.debug("  method: ", req.method);
                for(const rule of domainRules) {
                    let matchPath = false;
                    if(origin === rule.domain) {
                        let allHeaders = rule.allowHeaders || [];
                        if(rule.withCredentials) {
                            res.header("Access-Control-Allow-Credentials", true as any);
                        }
                        res.header("Access-Control-Allow-Origin", origin);
                        if(rule.rules?.length > 0) {
                            const reqPathName = req.originalUrl;
                            for(const apiRule of rule.rules) {
                                if(apiRule.path === reqPathName) {
                                    matchPath = true;
                                    if(apiRule.headers) {
                                        Object.keys(apiRule.headers).map((headerKey) => {
                                            res.header(headerKey, apiRule.headers[headerKey])
                                        });
                                    }
                                    if(apiRule.withCredentials) {
                                        res.header("Access-Control-Allow-Credentials",true as any);
                                        this.logger.debug("  Access-Control-Allow-Credentials", true);
                                    }
                                    if(apiRule.allowHeaders?.length > 0) {
                                        allHeaders = allHeaders.length !== 1 && allHeaders[0] !== "*" ? [...allHeaders, ...apiRule.allowHeaders] : apiRule.allowHeaders;
                                        res.header("Access-Control-Allow-Methods", apiRule.method.join(","));
                                        this.logger.debug("  Access-Control-Allow-Methods", apiRule.method.join(","));
                                    }
                                    break;
                                }
                            }
                        } else {
                            res.header("Access-Control-Allow-Methods", "*");
                        }
                        if(allHeaders.length === 1 && allHeaders[0] === "*") {
                            !matchPath && res.header("Access-Control-Allow-Headers", "*");
                        } else {
                            res.header("Access-Control-Allow-Headers", allHeaders?.length > 0 ? allHeaders.join(",") : "");
                            this.logger.debug("  Access-Control-Allow-Methods", allHeaders.join(","));
                        }
                        if(rule.headers) {
                            Object.keys(rule.headers).map((headerKey) => {
                                res.header(headerKey, rule.headers[headerKey])
                            });
                        }
                        res.header("Content-Type", "application/json;charset=utf-8");
                        if(isOptions) {
                            res.status(200).send({});
                            this.logger.debug("Option请求跨域检查通过");
                        }
                        break;
                    }
                }
                this.logger.debug("Cross origin configuration checking complete");
            }
            req.method !== "OPTIONS" && next();
        });
    }
}