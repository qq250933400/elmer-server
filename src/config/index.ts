import utils from "../utils/utils";
import {
    META_KEY_INSTANCE_ID,
    COMMAND_KEY_APP_ENV,
    COMMAND_KEY_CONFIG_PATH,
    META_KEY_CONFIG_INFO
} from "../data/constants";
import { v7 as uuid } from "uuid";
import { Application } from "../Application/Core/Application";
import { getModuleObj } from "../Annotation/createInstance";
import { IConfigApplication } from "./interface/IConfigApplication";

import path from "path";
import fs from "fs";
import lodash from "lodash";

/**
 * 装载配置文件信息, 必须在启动类使用此装饰器配置才能生效
 * @param fileName 配置文件路径
 * @returns 
 */
export const Config = (fileName: string) => (Target: new(...args: any[]) => any) => {
    const env = utils.getCommand(process.argv, COMMAND_KEY_APP_ENV);
    const configPath = utils.getCommand(process.argv, COMMAND_KEY_CONFIG_PATH) || "./";
    const rootPath = process.env["INIT_CWD"] as any;
    const baseConfigFileName = path.resolve(rootPath,configPath, fileName);
    const configData = {
        base: baseConfigFileName,
        env: null
    };
    const saveConfigInfo: any[] = Reflect.getMetadata(META_KEY_CONFIG_INFO, Target) || [];
    const saveId = uuid();
    if(!fs.existsSync(baseConfigFileName)) {
        throw new Error(`配置文件不存在: ${baseConfigFileName}`);
    }
    if(!utils.isEmpty(env)) {
        const name = utils.getFileNameEx(fileName);
        const fileType = utils.getFileType(fileName);
        const envConfigFileName = path.resolve(rootPath,configPath, `./${name}-${env}.${fileType}`);
        if(fs.existsSync(envConfigFileName)) {
            configData.env = envConfigFileName as any;
        }
    }
    saveConfigInfo.push({
        id: saveId,
        data: configData
    });
    Reflect.defineMetadata(META_KEY_CONFIG_INFO, saveConfigInfo, Target);
};
/**
 * 获取配置信息
 * @param key - 配置Category key
 * @param id - 配置Category 下的id
 * @returns 
 */
export const GetConfig = <ConfigKey extends keyof IConfigApplication>(
    key?: ConfigKey,
    id?: keyof IConfigApplication[ConfigKey]
) => (value: any, context: ClassFieldDecoratorContext<any, any>): any => {
    return function(this: any) {
        if(context.kind === "field") {
            const getConfigData = function(this: any) {
                const instanceId = Reflect.getMetadata(META_KEY_INSTANCE_ID, this);
                const applicationObj = getModuleObj(Application, instanceId);
                let overrideConfigData: any = null;
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
