import "reflect-metadata";
import { logger } from "../logs";

type TypeDecoratorType = "Class" | "Property" | "Method" | "Controller";

export default (fn:Function, factory: new(...args: any[]) => any, type: TypeDecoratorType = "Class") => {
    try {
        Reflect.defineMetadata("DecoratorType", type || "Class", factory);
        fn();
    } catch(e) {
        logger.error(e.stack);
    }
}