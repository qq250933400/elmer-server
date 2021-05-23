import "reflect-metadata";
import * as express from "express";
import { Express,Request, Response } from "express";
import GlobalStore,{ DECORATOR_MODEL_TYPE } from "./GlobalStore";
import DefineDecorator from "./DefineDecorator";
import { ROUTER_KEY, ROUTER_FLAG_SSID } from "./Controller";

/**
 * 初始化所有controller
 * @param app 
 */
const initRouter = (app:Express): void => {
    const controllers = GlobalStore.getControllers();
    if(controllers) {
        Object.keys(controllers).map((namespace) => {
            const Controller = controllers[namespace];
            const ssid = Reflect.getMetadata(ROUTER_KEY, Controller);
            if(ssid !== ROUTER_FLAG_SSID) {
                throw new Error(`路由Controller定义错误，必须使用Controller装饰器声明。(${namespace})`);
            } else {
                const obj = new Controller();
                const protoObj = obj["__proto__"];
                protoObj && Object.keys(protoObj).map((attr: string) => {
                    const prefixKey = attr.substr(0, ROUTER_KEY.length);
                    if(prefixKey === ROUTER_KEY) {
                        const attrFn = protoObj[attr];
                        if(typeof attrFn === "function") {
                            attrFn(app);
                        } else {
                            throw new Error("定义路由请求method不是Function函数。");
                        }
                    }
                });
            }
        });
    }
};

export const BootApplication = (Target: new(...args: any[]) => any) => {
    DefineDecorator(() => {
        if(typeof Target.prototype.main !== "function") {
            throw new Error("启动类必须实现main函数。");
        }
        const mainCallback = Target.prototype.main;
        Reflect.defineMetadata(DECORATOR_MODEL_TYPE,"BootApplication", Target);
        GlobalStore.add(Target);
        Target.prototype.main = () => {
            const app = express();
            initRouter(app);
            mainCallback.call(Target.prototype);
        };
    }, Target);
}

export type TypeBootApplication = {
    main():void;
};
