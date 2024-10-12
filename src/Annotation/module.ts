import "reflect-metadata";
import { utils } from "elmer-common";
import { v7 as uuid } from "uuid";
import {
    META_KEY_MODULE_TYPE,
    META_KEY_MODULE_ID,
    META_VALUE_MODULE_APPSERVICE,
    META_VALUE_MODULE_REQUEST,
    META_VALUE_MODULE_INJECT,
    META_KEY_INSTANCE_ID,
    META_VALUE_MODULE_DATABASE,
    META_VALUE_MODULE_PARAM,
    PROTECT_MODULE_IDS
} from "../data/constants";
import { createInstance } from "./createInstance";
import { IAnnotationOption } from "../interface/IAnnotation";


interface IModuleData {
    factory: Record<string, new(...args: any[]) => any>;
    instance: Record<string, Object>;
}

interface IDefineModuleOption {
    errmsg?: string;
    moduleId?: string;
}

interface IAppServiceExOption {
    overrideId?: boolean;
}

const moduleData: IModuleData = {
    factory: {},
    instance: {}
};
export const defineModule = <IFactory extends new(...args: any[]) => any>(Target: IFactory, CONST_MODULE_TYPE: string, context: ClassDecoratorContext<any>, opt?: IDefineModuleOption) => {
    if(context.kind === "class") {
        // 兼容旧模块定义
        const oldModuleType = Reflect.getMetadata(META_KEY_MODULE_TYPE, Target);
        const mid = opt?.moduleId || uuid();
        if(!utils.isEmpty(oldModuleType)) {
            throw new Error(opt?.errmsg || "The module can not use with other class decorator.");
        }
        if(moduleData.factory[mid]) {
            throw new Error(`The module can not be defined, module id ready exists. (${mid})`);
        }
        Reflect.defineMetadata(META_KEY_MODULE_TYPE, CONST_MODULE_TYPE, Target);
        Reflect.defineMetadata(META_KEY_MODULE_ID, mid, Target);
        // ts5定义方式
        
        moduleData.factory[mid] = Target;
    
        return Target;
    } else {
        throw new Error(`This decorator is a class decorator. [${context.name}]`);
    }
};


/**
 * check the target is a valid module
 * @param Target - detect target class
 * @returns 
 */
export const validateModule = (Target: new(...args: any[]) => any) => {
    const moduleId = Reflect.getMetadata(META_KEY_MODULE_ID, Target) || (Target.prototype?.constructor && validateModule(Target.prototype.constructor));
    return !utils.isEmpty(moduleData.factory[moduleId]);
};

export const validateModuleEx = (Target: new(...args: any[]) => any, moduleType: string) => {
    const saveModuleType = Reflect.getMetadata(META_KEY_MODULE_TYPE, Target);
    return validateModule(Target) && saveModuleType === moduleType;
};

export const getModuleId = (Target: new(...args: any[]) => any) => {
    return Reflect.getMetadata(META_KEY_MODULE_ID, Target);
};

export const AppService = <IFactory extends new(...args: any[]) => any>(Factory: IFactory, context: ClassDecoratorContext<any>) => {
    if(context.kind === "class") {
        return defineModule<IFactory>(Factory, META_VALUE_MODULE_APPSERVICE, context);
    }
};
/**
 * 注入模块，自定义模块id
 * @param moduleId 模块Id
 * @returns 
 */
export const AppServiceEx = <IFactory extends new(...args: any[]) => any>(moduleId: string, opt?: IAppServiceExOption) => (Factory: IFactory, context: ClassDecoratorContext<any>) => {
    if(context.kind === "class") {
        if(PROTECT_MODULE_IDS.includes(moduleId) && !opt?.overrideId) {
            throw new Error(`the module id is protect, can not be used. (${moduleId})`);
        }
        return defineModule<IFactory>(Factory, META_VALUE_MODULE_APPSERVICE, context, {
            moduleId
        });
    }
};

export const AppRequest = (Factory: new(...args: any[]) => any, context: ClassDecoratorContext<any>) => {
    return defineModule(Factory, META_VALUE_MODULE_REQUEST, context);
};


export const AppModel = <IFactory extends new(...args: any[]) => any, Args extends any[]>(...args: Args) => (Factory: IFactory, context: ClassDecoratorContext<any>) => {
    if(context.kind !== "class") {
        throw new Error("@AppModel can only be used on class.");
    }
    if(!validateModule(Factory)) {
        throw new Error(`The @AppModel can only be used on a class was defined by AppService, AppRequest. (${getModuleId(Factory)})`);
    }
    const initParams = function(...params: any[]) {
        const opt: IAnnotationOption = params[0], rest: any[] = params.splice(0,1);
        const instanceId = opt.instanceId;
        const newParams: any[] = [];
        // 初始化传入Factory参数
        args.forEach((item) => {
            if(validateModule(item)) {
                const obj = createInstance(item, {
                    instanceId
                });
                newParams.push(obj);
            } else {
                newParams.push(item);
            }
        });
        console.log("----++--", context.name, params)
        return [...newParams, ...rest];
    };
    Reflect.defineMetadata(META_VALUE_MODULE_PARAM, args, Factory);
    return class extends Factory {
        constructor(...reset: any[]) {
            super(...initParams(...reset));
        }
    }
};
