import { AppService } from "../core/Module";
import { Request, Response } from "express";
import { GetConfig, IConfigCrossSite } from "../config";
import { Log } from "../logs";

@AppService
export class Security {
    @GetConfig("Security")
    private config: IConfigCrossSite;
    constructor(
        private log: Log
    ) {}
    public crossOriginCheck(req: Request, res: Response) {
        const method = req.method;
        const configData = this.config;
        const logger = this.log;
        const isOptions = method === "OPTIONS";
        const origin = req.headers["origin"];
        const host =  req.protocol + "://" + req.get("host");
        if( ((
                this.config.enabled === undefined ||
                this.config.enabled === null
            ) || this.config.enabled) &&
            origin !== host &&
            /^http[s]{0,1}:\/\//i.test(origin)
        ) {    
            const domainRules = configData.rules || [];        
            isOptions && logger.debug("开始跨域配置检查: ", req.originalUrl);
            isOptions && logger.debug("  Origin : ", origin);
            isOptions && logger.debug("  host   : ", host);
            isOptions && logger.debug("  path   : ", req.url);
            isOptions && logger.debug("  method : ", method);   
            for(const rule of domainRules) {
                let matchPath = false;
                if(origin === rule.domain) {
                    let allHeaders = rule.allowHeaders || [];
                    res.header("Access-Control-Allow-Origin", origin);
                    if(rule.withCredentials) {
                        res.header("Access-Control-Allow-Credentials", true as any);
                        isOptions && logger.debug("  Access-Control-Allow-Credentials", true);
                    }
                    if(rule.rules?.length > 0) {
                        const reqPathName = req.originalUrl;
                        let matchAllowHeaders = false
                        for(const apiRule of rule.rules) {
                            if(apiRule.path === reqPathName) {
                                matchPath = true;
                                if(apiRule.headers) {
                                    Object.keys(apiRule.headers).map((headerKey) => {
                                        res.header(headerKey, apiRule.headers[headerKey]);
                                        isOptions && logger.debug("  Header:", `${headerKey}=${apiRule.headers[headerKey]}`);
                                    });
                                }
                                if(apiRule.withCredentials) {
                                    res.header("Access-Control-Allow-Credentials",true as any);
                                    isOptions && logger.debug("  Access-Control-Allow-Credentials", true);
                                }
                                if(apiRule.allowHeaders?.length > 0) {
                                    allHeaders = allHeaders.length !== 1 && allHeaders[0] !== "*" ? [...allHeaders, ...apiRule.allowHeaders] : apiRule.allowHeaders;
                                    matchAllowHeaders = true;
                                    res.header("Access-Control-Allow-Headers", apiRule.method.join(","));
                                    isOptions && logger.debug("  Access-Control-Allow-Headers", apiRule.method.join(","));
                                }
                                if(apiRule.method?.length > 0) {
                                    res.header("Access-Control-Allow-Method", apiRule.method.join(","));
                                    isOptions && logger.debug("  Access-Control-Allow-Method", apiRule.method.join(","));
                                }
                                break;
                            }
                        }
                        if(!matchAllowHeaders) {
                            if(rule.allowHeaders.length === 1 && rule.allowHeaders[0] === "*") {
                                res.header("Access-Control-Allow-Headers", "*");
                                isOptions && logger.debug("  Access-Control-Allow-Headers", "*", "Not Match Allow Headers");
                            }
                        }
                    } else {
                        res.header("Access-Control-Allow-Methods", "*");
                        isOptions && logger.debug("  Access-Control-Allow-Methods: *");
                    }
                    if(allHeaders.length === 1 && allHeaders[0] === "*") {
                        !matchPath && res.header("Access-Control-Allow-Headers", "*");
                        isOptions && !matchPath && logger.debug("  Access-Control-Allow-Headers", "*", "Not Match Api");
                    } else {
                        res.header("Access-Control-Allow-Headers", allHeaders?.length > 0 ? allHeaders.join(",") : "");
                        isOptions && logger.debug("  Access-Control-Allow-Methods", allHeaders.join(","));
                    }
                    if(rule.headers) {
                        Object.keys(rule.headers).map((headerKey) => {
                            res.header(headerKey, rule.headers[headerKey])
                        });
                    }
                    res.header("Content-Type", "application/json;charset=utf-8");
                    if(isOptions) {
                        res.status(200).send({});
                        isOptions && logger.debug("Option请求跨域检查通过");
                        return true;
                    }
                    break;
                }
            }
        } else {
            isOptions && logger.debug("未开启跨域检查校验。");
        }
    }
}