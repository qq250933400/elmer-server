import { Request, Response } from "express";
import utils from "../core/utils";

export type TypePluginCallbackOption = {
    returnValue: any
};
/**
 * provider定义不同类型的plugin的方法，用于不同场景
 * 同一个plugin类可以同时定义多个provider用于handle不同场景做扩展
 */
export type TypePluginProvider = "RequestPlugin" | "DataModelPlugin" | "MysqlPlugin";

export type TypeRequestProvider = {
    beforeRequest?: (options: TypePluginCallbackOption, req: Request, res: Response, next: Function) => void;
    afterRequest?: (options: TypePluginCallbackOption, req: Request, res: Response, next: Function) => void;
    beforSend?: (options: TypePluginCallbackOption, data: any) => any;
    exception?: (options: TypePluginCallbackOption, error: Error, req: Request, res: Response) => void;
};

export type TypeDataModelProvider = {
    parameterization?: (options: TypePluginCallbackOption, queryValue: string|object, params: any, fn: Function) => void;
    parameterValidate?: (options: TypePluginCallbackOption, value: string|number) => void;
};

type TypePluginRegisterProviders = {
    RequestPlugin: TypeRequestProvider;
    DataModelPlugin: TypeDataModelProvider;
    MysqlPlugin: TypeDataModelProvider;
};

type TypePluginRegisterOptions= TypePluginRegisterProviders[TypePluginProvider];

/**
 * 定义当前类型控制plugin的生命周期
 *   Request随请求结束随即会被销毁
 *   Server随服务常驻内存，全局只会有一个对象
 * */
export type TypePluginType = "Request" | "Server";

export abstract class ABasePlugin {
    static uuid: string = "0b57a8d9-b1ed-1b29-d87f-6e494c5e";
    private registeState: any = {};
    abstract init(): void;
    /** 返回插件ID,请使用guid， api生成无序不冲突的字符串 */
    abstract getId(): string;
    /** 返回插件类型 */
    abstract getType(): TypePluginType;

    destory?(): void;
    register(provider: TypePluginProvider, options: TypePluginRegisterOptions): void {
        if(!this.registeState[provider]) {
            this.registeState[provider] = [];
        }
        this.registeState[provider].push(options);
    }
    exec(provider: TypePluginProvider, name: keyof TypePluginRegisterProviders[TypePluginProvider], ...args: any[]): void {
        const providers = this.registeState[provider] || [];
        let execResult = null;
        for(const options of providers) {
            if(typeof options[name] === "function"){
                execResult = options[name](...args);
            }
        }
        return execResult;
    }
    hasProvider(provider: TypePluginProvider): boolean {
        return this.registeState[provider] ? true : false;
    }
}
