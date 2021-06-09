import "reflect-metadata";
import GlobalStore,{ DECORATOR_MODEL_TYPE, TypeSupportModel } from "./GlobalStore";
import DefineDecorator from "./DefineDecorator";
import { StaticCommon as utils } from "elmer-common";

export const Param = (target: Object, methodName: string, paramIndex: number):any => {
    console.log("--Param---", methodName, paramIndex);
    return "Hello my";
}

export const Model = (Target: new(...args:any[]) => any) => {
    DefineDecorator(() => {
        Reflect.defineMetadata(DECORATOR_MODEL_TYPE, "Model", Target);
    }, Target);
};

export const Service = (Target: new(...args:any[]) => any) => {
    DefineDecorator(() => {
        const idKey = [DECORATOR_MODEL_TYPE, "ID"].join("_");
        const dKey = Reflect.getMetadata(idKey, Target);
        if(utils.isEmpty(dKey)) {
            Reflect.defineMetadata(DECORATOR_MODEL_TYPE, "Service", Target);
            Reflect.defineMetadata(idKey, "Service_" + utils.guid(), Target);
        }
    }, Target);
};

export const Autowired = (Factory: new(...args: any[]) => any) => {
    return (target: any, attrKey: string) => {
        DefineDecorator(() =>{
            const type: TypeSupportModel = Reflect.getMetadata(DECORATOR_MODEL_TYPE, Factory);
            switch(type) {
                case "Service": {
                    Object.defineProperty(target, attrKey, {
                        enumerable: true,
                        configurable: true,
                        get: () => GlobalStore.getService(Factory),
                        set: () => {
                            throw new Error(`不允许重写当前属性(${attrKey})。`);
                        }
                    });
                    break;
                }
                case "Model": {
                    Object.defineProperty(target, attrKey, {
                        enumerable: true,
                        configurable: true,
                        get: () => GlobalStore.getModel(Factory),
                        set: () => {
                            throw new Error(`不允许重写当前属性(${attrKey})。`);
                        }
                    });
                    break;
                }
                case "DataModel": {
                    Object.defineProperty(target, attrKey, {
                        enumerable: true,
                        configurable: true,
                        get: () => GlobalStore.getModel(Factory),
                        set: () => {
                            throw new Error(`不允许重写当前属性(${attrKey})。`);
                        }
                    });
                    break;
                }
                default: {
                    throw new Error("不合法的类");
                }
            }
        }, Factory, "Property");
    }
};