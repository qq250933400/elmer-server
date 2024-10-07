import { defineModule } from "../../Annotation/module";
import { META_VALUE_MODULE_REQUEST, GLOBAL_KEY_CONTROLLER_BASE_PATH } from "../../data/constants";
import { defineRoute } from "./Annotation";
import utils from "../../utils/utils";

export const Controller = (pathname?: string) => (Target: new(...args: any[])=>any, context: ClassDecoratorContext<any>) => {
    defineModule(Target, META_VALUE_MODULE_REQUEST, context, {
        errmsg: "The Controller can not use with other class decorator",
    });
    if(!utils.isEmpty(pathname) && !/^\//.test(pathname)) {
        throw new Error(`The Controller pathname must start with '/'. (${context.name}=>${pathname})`);
    }
    const defineControllerClass = class extends Target {
        static readonly [GLOBAL_KEY_CONTROLLER_BASE_PATH]: string = pathname;
    };
    defineRoute(pathname, defineControllerClass);
    return defineControllerClass;
};
