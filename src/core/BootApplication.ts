import "reflect-metadata";
import * as express from "express";
import * as path from "path";
import * as cookieParser from "cookie-parser";
import * as expressSession from "express-session";
import { Express,Request, Response } from "express";
import GlobalStore,{ DECORATOR_MODEL_TYPE } from "./GlobalStore";
import DefineDecorator from "./DefineDecorator";
import { ROUTER_KEY, ROUTER_FLAG_SSID, initRoute } from "./Controller";
import { getLogger } from "../logs";
import { json } from 'body-parser';
import { pluginExec, pluginInit } from "../plugin/PluginExec";
import { HtmlParse } from "elmer-virtual-dom";
import { utils } from "elmer-common";

type TypeDefineGlobalObject = {
    factory: new(...args: any[]) => any;
    /** 定义当前模块唯一标识 */
    ssid: string;
    /** 全局变量名方便调用 */
    varName: string;
};
const crossSiteConfig = (app:Express) => {
    app.all('*', (req: Request, res: Response, next) => {
        const eventObj = {
            continue: true
        };
        pluginExec(["Request"], "RequestPlugin", "beforeAll", req, res, next, eventObj);
        eventObj.continue && next();
    });
    app.use(expressSession({
        genid: () => utils.guid(),
        secret: "ExpressApplication",
        cookie: {
            maxAge: 60000
        }
    }));
};
