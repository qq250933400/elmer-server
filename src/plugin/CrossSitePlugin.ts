import { ABasePlugin, TypePluginType } from "./ABasePlugin";
import { Request, Response } from "express";
import { GetConfig } from "../config";
import { IConfigCrossSite } from "../config/IConfigCrossSite";
import { getLogger } from "../logs";

export class CrossSitePlugin extends ABasePlugin {
    @GetConfig(null, "CrossSite")
    private config: IConfigCrossSite;
    init(): void {
        this.register("RequestPlugin", {
            beforeAll: this.beforeAll.bind(this)
        });
    }
    getId(): string {
        return "fbd74c72-30e8-885f-2642-9341e43b";
    }
    getType(): TypePluginType {
        return "Request";
    }
    private beforeAll({}, req: Request, res: Response, next: Function, opt: any): void {
        const method = req.method;
        const configData = this.config;
        const logger = getLogger();
        if(configData?.enabled) {
            const origin = req.headers["origin"];
            const isOptions = method === "OPTIONS";
            logger.debug("开始跨域配置检查: ", req.url);
            for(const rule of configData.rules) {
                if(origin === rule.domain) {
                    let allHeaders = rule.allowHeaders || [];
                    if(rule.withCredentials) {
                        res.header("Access-Control-Allow-Credentials",true as any);
                    }
                    res.header("Access-Control-Allow-Origin", origin);
                    if(rule.rules?.length > 0) {
                        for(const apiRule of rule.rules) {
                            if(apiRule.path === req.path) {
                                if(apiRule.allowHeaders?.length > 0) {
                                    allHeaders = [...allHeaders, ...apiRule.allowHeaders];
                                    res.header("Access-Control-Allow-Methods", apiRule.method.join(","));
                                    break;
                                }
                                if(apiRule.headers) {
                                    Object.keys(apiRule.headers).map((headerKey) => {
                                        res.header(headerKey, apiRule.headers[headerKey])
                                    });
                                }
                                if(apiRule.withCredentials) {
                                    res.header("Access-Control-Allow-Credentials",true as any);
                                }
                            }
                        }
                    } else {
                        res.header("Access-Control-Allow-Methods", "*");
                    }
                    if(allHeaders.length === 1 && allHeaders[0] === "*") {
                        res.header("Access-Control-Allow-Headers", req.headers["access-control-request-headers"]);
                    } else {
                        res.header("Access-Control-Allow-Headers", allHeaders?.length > 0 ? allHeaders.join(",") : "");
                    }
                    if(rule.headers) {
                        Object.keys(rule.headers).map((headerKey) => {
                            res.header(headerKey, rule.headers[headerKey])
                        });
                    }
                    res.header("Content-Type", "application/json;charset=utf-8");
                    if(isOptions) {
                        res.status(200).send({});
                        opt.continue = false;
                        logger.debug("Option请求跨域检查通过");
                    }
                    break;
                }
            }
        } else {
            logger.debug("未开启跨域检查校验。");
        }
    }
}