import "reflect-metadata";
import * as express from "express";
import * as path from "path";
import * as cookieParser from "cookie-parser";
import * as expressSession from "express-session";
import { Express,Request, Response } from "express";
import GlobalStore,{ DECORATOR_MODEL_TYPE } from "./GlobalStore";
import DefineDecorator from "./DefineDecorator";
import { ROUTER_KEY, ROUTER_FLAG_SSID, initRoute } from "./Controller";
import { json } from 'body-parser';
import { pluginExec, pluginInit } from "../plugin/PluginExec";
import { HtmlParse } from "elmer-virtual-dom";
import { utils } from "elmer-common";
import {
    CONST_DECORATOR_FOR_MODULE_BOOTAPPLICATION,
    CONST_BOOTAPPLICATION_MODULE_FLAG
} from "../data";
import { AppService, createInstance } from "./Module";
import { invokeApplication } from "./Application";

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


export const BootApplication = (Target: new(...args:any) => any): void => {
    AppService(Target);
    Reflect.defineMetadata(CONST_DECORATOR_FOR_MODULE_BOOTAPPLICATION, CONST_BOOTAPPLICATION_MODULE_FLAG, Target);   
}

export const startApplication = <T={}>(App: new(...args:any) => any ): T => {
    const bootApplicationFlag = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_BOOTAPPLICATION, App);
    if(bootApplicationFlag !== CONST_BOOTAPPLICATION_MODULE_FLAG) {
        throw new Error("Application模块需要使用BootApplication装饰器装载。");
    } else {
        const instance = createInstance(App);
        const app = express();
        invokeApplication(instance, app);
        return instance;
    }
}