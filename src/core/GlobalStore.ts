import "reflect-metadata";
import { TypeBootApplication } from "./BootApplication";
import utils from "../utils/utils";

type TypeStoreMemory = {
    BootApp: TypeBootApplication;
    ConfigData: any;
    ServicePool: any;
    Controllers: any;
    Plugins: (new(...args: any[]) => any)[];
    GlobalObjectFactoryPool: any[];
    GlobalObjectPool: any;
};

type TypeStoreKeys = keyof TypeStoreMemory;

export type TypeSupportModel = "BootApplication" | "Model" | "DataModel" | "Service" | "Controller";

const StoreMemory:TypeStoreMemory = {
    BootApp: null,
    ConfigData: {},
    ServicePool: {},
    Controllers: {}, 
    Plugins: [],
    GlobalObjectFactoryPool: [],
    GlobalObjectPool: {}
};


export const DECORATOR_MODEL_TYPE = "DECERATE_MODEL_TYPE";
export const DECORATOR_MODEL_PARAMS = "DECORATOR_MODEL_PARAMS";
export const DECORATOR_KEY = "9728e438-d856-41ca-b3d3-11812048";

class GlobalStore {
    add(factory: new(...args: any[]) => any): void {
        const modelType:TypeSupportModel = Reflect.getMetadata(DECORATOR_MODEL_TYPE, factory);
        switch(modelType) {
            case "BootApplication":
                if(!StoreMemory.BootApp) {
                    StoreMemory.BootApp = new factory();
                } else {
                    throw new Error("当前项目不允许出现多个启动类。");
                }
                break;
            case "Controller": {
                const namespace = Reflect.getMetadata("router_namespace", factory);
                if(utils.isEmpty(namespace)) {
                    throw new Error("Controller必须定义namespace");
                }
                if(StoreMemory.Controllers[namespace]) {
                    throw new Error(`控制器${namespace}冲突，请检查设置。`);
                }
                StoreMemory.Controllers[namespace] = factory;
                break;
            }
        }
    }
    setConfig(name: string, data: any): void {
        if(StoreMemory.ConfigData[name]) {
            throw new Error("配置失败：指定name已经存在或为系统保留名称。");
        } else {
            StoreMemory.ConfigData[name] = data;
        }
    }
    setPlugins(plugins: (new(...args: any[]) => any)[]): void {
        StoreMemory.Plugins = plugins;
    }
    getPlugins(): (new(...args: any[]) => any)[] {
        return StoreMemory.Plugins;
    }
    getConfig(name: string): any {
        return StoreMemory.ConfigData[name];
    }
    getControllers(): any {
        return StoreMemory.Controllers;
    };
    getModel(Factory: new(...args: any[]) => any): any {
        return new Factory(this.getClassParams(Factory));
    }
    getService<T={}>(Factory: new(...args:any[]) => any): T {
        const serviceId = Reflect.getMetadata([DECORATOR_MODEL_TYPE, "ID"].join("_"), Factory);
        if(StoreMemory.ServicePool[serviceId]) {
            // 已经有对象存在不需要再次创建
            return StoreMemory.ServicePool[serviceId];
        } else {
            const newParams: any[] = this.getClassParams(Factory);
            const obj = new Factory(...newParams);
            StoreMemory.ServicePool[serviceId] = obj;
            return obj;
        }
    }
    getGlobalStore(globalStateKey: TypeStoreKeys): TypeStoreMemory[TypeStoreKeys] {
        return StoreMemory[globalStateKey];
    }
    setGlobalStore<T={}>(globalStateKey: Exclude<TypeStoreKeys, "BootApp" | "ConfigData" | "ServicePool" | "Controllers" | "Plugins">, value: T): void {
        StoreMemory[globalStateKey] = value as any;
    }
    /**
     * 检查参数类型并实例化注入
     * @param Factory 
     * @returns 
     */
    public getClassParams(Factory: new(...args: any[])=>any): any[] {
        const paramTypes: any[] = Reflect.getMetadata("design:paramtypes",Factory);
        const newParams: any[] = [];
        if(paramTypes?.length > 0) {
            paramTypes.map((param) => {
                const classType = Reflect.getMetadata(DECORATOR_MODEL_TYPE, param);
                if(classType === "Service") {
                    newParams.push(this.getService(param as any));
                } else if(classType === "Model") {
                    newParams.push(this.getModel(param as any));
                } else {
                    newParams.push(param);
                }
            });
        }
        return newParams;
    }
};

export default new GlobalStore();
