import "reflect-metadata";
import { utils } from "elmer-common";
import { v7 as uuid } from "uuid";
import {
    META_KEY_MODULE_TYPE,
    META_KEY_MODULE_ID,
    META_VALUE_MODULE_APPSERVICE,
    META_VALUE_MODULE_REQUEST,
    META_VALUE_MODULE_INJECT,
    META_KEY_INSTANCE_ID
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
        return class extends Target {
            constructor(...params: any[]) {
                super(...params);
            }
        }
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
    const moduleId = Reflect.getMetadata(META_KEY_MODULE_ID, Target);
    return !utils.isEmpty(moduleData.factory[moduleId]);
};

export const validateModuleEx = (Target: new(...args: any[]) => any, moduleType: string) => {
    const saveModuleType = Reflect.getMetadata(META_KEY_MODULE_TYPE, Target);
    return validateModule(Target) && saveModuleType === moduleType;
};

export const getModuleId = (Target: new(...args: any[]) => any) => {
    return Reflect.getMetadata(META_KEY_MODULE_ID, Target);
};

export const Param = (target: Object, propertyName: string, parameterIndex: number) => {
    console.log("target", target, parameterIndex);
};

export const AppService = <IFactory extends new(...args: any[]) => any>(Factory: IFactory, context: ClassDecoratorContext<any>) => {
    if(context.kind === "class") {
        return defineModule<IFactory>(Factory, META_VALUE_MODULE_APPSERVICE, context);
    }
};

export const AppRequest = (Factory: new(...args: any[]) => any, context: ClassDecoratorContext<any>) => {
    defineModule(Factory, META_VALUE_MODULE_REQUEST, context);
};


export const AppModel = <IFactory extends new(...args: any[]) => any, Args extends any[]>(...args: Args) => (Factory: IFactory, context: ClassDecoratorContext<any>) => {
    if(context.kind !== "class") {
        throw new Error("@AppModel can only be used on class.");
    }
    if(!validateModule(Factory)) {
        throw new Error(`The @AppModel can only be used on a class was defined by AppService, AppRequest. (${getModuleId(Factory)})`);
    }
    const initParams = function(opt: IAnnotationOption, ...p: any[]) {
        const instanceId = opt.instanceId;
        const newParams: any[] = [];
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
        return [...newParams, ...p];
    };
    return class extends Factory {
        constructor(...reset: any[]) {
            super(...initParams.apply(null, reset));
        }
    }
};
