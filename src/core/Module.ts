import "reflect-metadata";
import { utils } from "elmer-common";
import {
    CONST_DECORATOR_FOR_MODULE_TYPE,
    CONST_DECORATOR_FOR_MODULE_CLASSID,
    CONST_DECORATOR_FOR_MODULE_INSTANCEID,
    EnumFactoryModuleType
} from "../data";

const instancePool: any = {};
const classPool: any[] = [];
const globalObjPool: any = {};

const defineFactoryService = (Target: new(...args: any[]) => any, type: EnumFactoryModuleType) => {
    const typeName = (EnumFactoryModuleType)[type];
    const uid = typeName + "_" + utils.guid();
    const checkType = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_TYPE, Target);
    if(utils.isEmpty(checkType)) {
        Reflect.defineMetadata(CONST_DECORATOR_FOR_MODULE_TYPE, type, Target);
        Reflect.defineMetadata(CONST_DECORATOR_FOR_MODULE_CLASSID, uid, Target);
        classPool.push(Target);
    } else {
        throw new Error(`多个定义模块类型装饰器不能同时使用.(${typeName})`);
    }
}

export const AppService = (Target: new(...args: any[]) => any) => {
    defineFactoryService(Target, EnumFactoryModuleType.AppService);
};

export const RequestService = (Target: new(...args: any[]) => any) => {
    defineFactoryService(Target, EnumFactoryModuleType.RequestService);
};

export const Service = (Target: new(...args: any[]) => any) => {
    defineFactoryService(Target, EnumFactoryModuleType.GlobalService);
};


export const createInstance = <T={}>(Factory: new(...args:any[]) => T, instanceId?: string):T => {
    const instanceAppId: string = instanceId || "app_" + utils.guid();
    const paramTypes: Function[] = Reflect.getMetadata("design:paramtypes", Factory) || [];
    // -------
    const classType: EnumFactoryModuleType = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_TYPE, Factory);
    let instance: any, shouldInit = false;
    if (!instancePool[instanceAppId]) {
        instancePool[instanceAppId] = {};
    }
    const paramsInstance: any[] = paramTypes.map((Fn: new(...args:any) => any) => {
        if(classPool.indexOf(Fn) < 0) {
            throw new Error(`${Fn.name}没有注册`);
        } else {
            const classType: EnumFactoryModuleType = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_TYPE, Fn);
            if(classType === EnumFactoryModuleType.GlobalService) {
                const objId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_CLASSID, Fn);
                if(globalObjPool[objId]) {
                    return globalObjPool[objId];
                } else {
                    return createInstance(Fn as any, instanceAppId);
                }
            } else if(classType === EnumFactoryModuleType.RequestService) {
                return createInstance(Fn as any, instanceAppId);
            } else if(classType === EnumFactoryModuleType.AppService) {
                const objId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_CLASSID, Fn);
                if(instancePool[instanceAppId] && instancePool[instanceAppId][objId]) {
                    return instancePool[instanceAppId][objId];
                } else {
                    if(!instancePool[instanceAppId]) {
                        instancePool[instanceAppId] = {};
                    }
                    const obj = createInstance(Fn as any, instanceAppId);
                    instancePool[instanceAppId][objId] = obj;
                    return obj;
                }
            } else {
                return new Fn();
            }
        }
    });
   
    if(classType === EnumFactoryModuleType.GlobalService) {
        const objId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_CLASSID, Factory);
        if(globalObjPool[objId]) {
            instance = globalObjPool[objId];
        } else {
            instance = new Factory(...paramsInstance);
            shouldInit = true;
        }
    } else if(classType === EnumFactoryModuleType.RequestService) {
        instance = new Factory(...paramsInstance);
        shouldInit = true;
    } else if(classType === EnumFactoryModuleType.AppService) {
        instance = new Factory(...paramsInstance);
        shouldInit = true;
    } else {
        instance = new Factory(...paramsInstance);
        shouldInit = true;
    }
    Reflect.defineMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, instanceAppId, Factory);
    Reflect.defineMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, instanceAppId, instance);
    // execLifeCycleOfInit(instance);
    return instance;
}