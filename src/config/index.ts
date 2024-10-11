import utils from "../utils/utils";
import {
    COMMAND_KEY_APP_ENV,
    COMMAND_KEY_CONFIG_PATH,
    META_KEY_CONFIG_INFO
} from "../data/constants";
import { v7 as uuid } from "uuid";

import path from "path";
import fs from "fs";

// console.error(GetConfig);
/**
 * 装载配置文件信息, 必须在启动类使用此装饰器配置才能生效
 * @param fileName 配置文件路径
 * @returns 
 */
export const Config = (fileName: string) => (Target: new(...args: any[]) => any) => {
    const env = utils.getCommand(process.argv, COMMAND_KEY_APP_ENV);
    const configPath = utils.getCommand(process.argv, COMMAND_KEY_CONFIG_PATH) || "./";
    const rootPath = process.env["INIT_CWD"] as any;
    const cwdConfigPath = path.resolve(rootPath, configPath);
    const baseConfigFileName = path.resolve(cwdConfigPath, fileName);
    const configData = {
        base: baseConfigFileName,
        rootPath: cwdConfigPath,
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

export * from "./GetConfig";
