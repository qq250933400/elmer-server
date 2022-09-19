import "reflect-metadata";
import { utils, Schema, queueCallFunc } from "elmer-common";
import {
    CONST_DECORATOR_FOR_MODULE_TYPE,
    CONST_DECORATOR_FOR_MODULE_CLASSID,
    CONST_DECORATOR_FOR_MODULE_INSTANCEID,
    CONST_DECORATOR_FOR_MODULE_INIT,
    CONST_DECORATOR_FOR_MODULE_ON_INIT,
    EnumFactoryModuleType
} from "../data";

type TypeCreateInstanceOptions = {
    args: any[];
    classType: EnumFactoryModuleType;
    shouldInit: boolean;
    uid: string;
};
type TypeCreateInstanceCallback = <T={}>(factory: new(...args:any[]) => any, option: TypeCreateInstanceOptions) => T;

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
};
const invokeInit = (Target: new(...args:any[]) => any, obj: any) => {
    const initCallbacks:Function[] = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INIT, Target) || [];
    // const instanceId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, Target);
    let index = 0;
    if(initCallbacks.length > 0) {
        queueCallFunc(initCallbacks as any[], (opt, fn: Function) => {
            return fn(obj, opt);
        }, {
            throwException: false,
            paramConvert: (fn) => {
                index += 1;
                return {
                    id: "init_" + index,
                    params: fn
                };
            }
        }).then(() => {
            const initData = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_ON_INIT, obj);
            if(initData) {
                initData.callback.apply(obj, initData.args || []);
            }
        }).catch((err) => {
            throw err;
        });
    }
};
export const delegateInit = (fn: Function) => {
    return (Target: new(...args: any[]) => any) => {
        const initCallbacks:Function[] = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INIT, Target) || [];
        initCallbacks.push(fn);
        Reflect.defineMetadata(CONST_DECORATOR_FOR_MODULE_INIT, initCallbacks, Target);
    };
};
export const onInit = (...args: any[]) => {
    return (target: any, attr: string, value: PropertyDescriptor) => {
        Reflect.defineMetadata(CONST_DECORATOR_FOR_MODULE_ON_INIT, {
            args,
            callback: value.value,
            name: attr
        }, target);
    };
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


export const createInstance = <T={}>(Factory: new(...args:any[]) => T, instanceId?: string, callback?: TypeCreateInstanceCallback):T => {
    const instanceAppId: string = instanceId || "app_" + utils.guid();
    const paramTypes: Function[] = Reflect.getMetadata("design:paramtypes", Factory) || [];
    // -------
    const classType: EnumFactoryModuleType = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_TYPE, Factory);
    const classId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_CLASSID, Factory);
    let instance: any, shouldInit = false;
    if (!instancePool[instanceAppId]) {
        instancePool[instanceAppId] = {};
    }
    /** Before init params should bind instance id, make sure the inject module can got the id */
    Reflect.defineMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, instanceAppId, Factory);
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
                    return createInstance(Fn as any, instanceAppId, callback);
                }
            } else if(classType === EnumFactoryModuleType.RequestService) {
                return createInstance(Fn as any, instanceAppId, callback);
            } else if(classType === EnumFactoryModuleType.AppService) {
                const objId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_CLASSID, Fn);
                if(instancePool[instanceAppId] && instancePool[instanceAppId][objId]) {
                    return instancePool[instanceAppId][objId];
                } else {
                    if(!instancePool[instanceAppId]) {
                        instancePool[instanceAppId] = {};
                    }
                    const obj = createInstance(Fn as any, instanceAppId, callback);
                    instancePool[instanceAppId][objId] = obj;
                    return obj;
                }
            } else {
                return new Fn();
            }
        }
    });
   
    if(classType === EnumFactoryModuleType.GlobalService) {
        if(globalObjPool[classId]) {
            instance = globalObjPool[classId];
        } else {
            instance = new Factory(...paramsInstance);
            shouldInit = true;
            globalObjPool[classId] = instance;
        }
    } else if(classType === EnumFactoryModuleType.RequestService) {
        const reqInitEvent = {
            args: paramsInstance,
            shouldInit: false,
            classType,
            uid: classId
        };
        instance = typeof callback === "function" ? callback(Factory, reqInitEvent) : null;
        shouldInit = reqInitEvent.shouldInit;
        if(!instance) {
            throw new Error("Failed to initialize request factory");
        }
    } else if(classType === EnumFactoryModuleType.AppService) {
        if(instancePool[instanceAppId][classId]) {
            instance = instancePool[instanceAppId][classId];
        } else {
            instance = new Factory(...paramsInstance);
            instancePool[instanceAppId][classId] = instance;
            shouldInit = true;
        }
    } else {
        const reqInitEvent = {
            args: paramsInstance,
            shouldInit: false,
            classType,
            uid: classId
        };
        instance = typeof callback === "function" ? callback(Factory, reqInitEvent) : null;
        shouldInit = reqInitEvent.shouldInit;
        if(!instance) {
            instance = Factory;
        }
    }
    Reflect.defineMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, instanceAppId, instance);
    shouldInit && invokeInit(Factory, instance);
    
    return instance;
}

export const getObjFromInstance = (Target: new(...args: any[]) => any, instance: any, callback?: TypeCreateInstanceCallback) => {
    const instanceId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, instance) ||
        Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, instance.constructor);
    const targetObj = createInstance(Target, instanceId, callback);

    return targetObj;
};

export const GetInstanceId = (target: any, attrKey: string) => {
    Object.defineProperty(target, attrKey, {
        configurable: false,
        enumerable: true,
        get: () => {
            const instanceId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, target) ||
                Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, target.constructor);
            return instanceId;
        }
    });
};