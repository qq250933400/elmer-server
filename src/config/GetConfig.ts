import { getModuleById, getInstanceId } from "../Annotation/createInstance";
import { META_KEY_INSTANCE_ID } from "../data/constants";
import type { IConfigApplication } from "./interface";
import lodash from "lodash";

class Application {
    configuration: any ={};
}
/**
 * 获取配置信息
 * @param key - 配置Category key
 * @param id - 配置Category 下的id
 * @returns 
 */
export const GetConfig = <ConfigKey extends keyof IConfigApplication>(key?: ConfigKey, id?: keyof IConfigApplication[ConfigKey]) => (value: any, context: ClassFieldDecoratorContext<any, any>): any => {
    return function(this: any) {
        if(context.kind === "field") {
            const getConfigData = function(this: any) {
                const instanceId = getInstanceId(this);
                const applicationObj = getModuleById(instanceId, "Application");
                let overrideConfigData: any = value;
                if(applicationObj) {
                    const configData: any = applicationObj.configuration || {};
                    if(!key || lodash.isEmpty(key)) {
                        overrideConfigData = configData;
                    } else {
                        if(!lodash.isEmpty(key)) {
                            overrideConfigData = lodash.get(configData, key);
                        } else {
                            overrideConfigData = configData;
                        }
                        overrideConfigData = id && !lodash.isEmpty(id) ? lodash.get(overrideConfigData, id) : overrideConfigData;
                    }
                    return overrideConfigData;
                } else {
                    console.error("Application instance is not found.", this);
                }
            };
            delete this[context.name];
            Object.defineProperty(this, context.name, {
                get: () => getConfigData.call(this),
                set: () => {}
            });
        } else {
            throw new Error("the @GetConfig can only use on class attribute.");
        }
    }
};

export default GetConfig;