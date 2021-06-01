import { Request, Response } from "express";
import utils from "../core/utils";

/**
 * provider定义不同类型的plugin的方法，用于不同场景
 * 同一个plugin类可以同时定义多个provider用于handle不同场景做扩展
 */
export type TypePluginProvider = "RequestPlugin" | "DataModelPlugin";

export type TypeRequestProvider = {
    beforeRequest?: (req: Request, res: Response, next: Function) => void;
    afterRequest?: (req: Request, res: Response, next: Function) => void;
};
export type TypeDataModelProvider = {};

type TypePluginRegisterProviders = {
    RequestPlugin: TypeRequestProvider;
    DataModelPlugin: TypeDataModelProvider;
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
        const providerId = "provider_" + utils.guid();
        if(!this.registeState[provider]) {
            this.registeState[provider] = {};
        }
        this.registeState[provider][providerId] = options;
    }
    exec(provider: TypePluginProvider, name: keyof TypePluginRegisterProviders[TypePluginProvider], ...args: any[]): void {
        const providerObj = this.registeState[provider];
        providerObj && Object.values(providerObj).map((options: any) => {
            typeof options[name] === "function" && options[name](...args);
        });
    }
}
