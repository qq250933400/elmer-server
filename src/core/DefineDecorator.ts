import "reflect-metadata";
import { logger } from "../logs";
import { DECORATOR_KEY } from "./GlobalStore";

type TypeDecoratorType = "Class" | "Property" | "Method" | "Controller";


export const DefineParamDecorator = (target: any, methodName: string, paramIndex: number, fn:Function) => {
    try {
        const key = "PARAM_DECORATOR_" + DECORATOR_KEY;
        const callback = fn();
        if(!target[key]) {
            target[key] = {};
        }
        if(!target[key][methodName]) {
            target[key][methodName] = [];
        }
        target[key][methodName].push({
            index: paramIndex,
            callback
        });
    } catch(e) {
        logger.error(e.stack);
    }
}

export default (fn:Function, factory: new(...args: any[]) => any, type: TypeDecoratorType = "Class") => {
    try {
        Reflect.defineMetadata("DecoratorType", type || "Class", factory);
        fn();
    } catch(e) {
        logger.error(e.stack);
    }
}