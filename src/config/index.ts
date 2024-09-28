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
    const rootPath = process.env["INIT_CWD"];
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
            configData.env = envConfigFileName;
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
export const GetConfig = <ConfigKey extends keyof IConfigApplication>(key?: ConfigKey, id?: keyof IConfigApplication[ConfigKey]) => (target: Object, propertyKey: string) => {
    Object.defineProperty(target, propertyKey, {
        get: () => {
            const instanceId = Reflect.getMetadata(META_KEY_INSTANCE_ID, target.constructor);
            const applicationObj = getModuleObj(Application, instanceId);
            const configData = lodash.get(applicationObj.configuration || {}, key);
            if(lodash.isEmpty(key)) {
                return applicationObj.configuration || {};
            } else {
                return !lodash.isEmpty(id) ? lodash.get(configData, id) : configData;
            }
        }
    });
};
