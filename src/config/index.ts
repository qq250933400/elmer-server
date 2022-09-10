import "reflect-metadata";
import GlobalStore from "../core/GlobalStore";
import { Schema } from "../core/Schema";
import * as fs from "fs";
import * as path from "path";
import { parse } from "yaml";
import ApplicationConfigSchema from "./config.schema.application";
import DBConfigSchema from './config.schema.db';
import ServerConfigSchema from './config.schema.server';
import LogConfigSchema from "./config.schema.log";
import CrossSiteConfigSchema from "./config.schema.crossSite";
import EmailConfigSchema from "./config.schema.email";
import utils from "../utils/utils";
import { IConfigApplication } from "./IConfigApplication";
import { TypeConfigOptionKey, IConfigOption } from "./IConfiguration";
import { CONST_DECORATOR_FOR_CONFIGURATION } from "../data";

type TypeConfiguration = IConfigApplication & IConfigOption;

const readConfigData = (fileName: string):any => {
    const txt = fs.readFileSync(fileName, "utf8");
    if(/\.yml/i.test(fileName)) {
        return parse(txt);
    } else if(/\.json/i.test(fileName)) {
        return JSON.parse(txt);
    }
};

const loadConfigSchema = () => {
    const schemaObj = GlobalStore.getService<Schema>(Schema);
    schemaObj.addSchema("Application", ApplicationConfigSchema);
    schemaObj.addSchema("DB", DBConfigSchema);
    schemaObj.addSchema("Server", ServerConfigSchema);
    schemaObj.addSchema("Log", LogConfigSchema);
    schemaObj.addSchema("Security", CrossSiteConfigSchema);
    schemaObj.addSchema("Email", EmailConfigSchema);
    return {
        Application: ApplicationConfigSchema,
        DB: DBConfigSchema,
        Server: ServerConfigSchema,
        Log: LogConfigSchema,
        Security: CrossSiteConfigSchema,
        Email: EmailConfigSchema
    };
};
/**
 * 读取配置，支持yml,json两种数据格式
 * @param fileName 配置文件相对路径
 * @param name 配置保存名称,Application, DB, Server
 * @param schema 检验规则[可选]
 * @returns 
 */
export const Config = (fileName: string, name?: TypeConfigOptionKey, schema?: any) => {
    return (Target: new(...args: any[]) => any) => {
        const localFile = path.resolve(process.cwd(), fileName);
        if(fs.existsSync(localFile)) {
            const configData = readConfigData(localFile);
            const saveName = name || "Application";
            const schemaObj = GlobalStore.getService<Schema>(Schema);
            loadConfigSchema();
            if(schema && !utils.isEmpty(name)) {
                schemaObj.addSchema(name, schema);
            }
            if(saveName === "Application") {
                schemaObj.validate(configData, ApplicationConfigSchema, "Application");
            } else {
                schemaObj.validate(configData, saveName);
            }
            // GlobalStore.setConfig(saveName, configData);
            
            // Reflect.defineMetadata(CONST_DECORATOR_FOR_CONFIGURATION, )
        } else {
            throw new Error("指定配置文件不存在。");
        }
    }
};

export const GetConfig = <ConfigKey extends keyof TypeConfiguration>(configKey: ConfigKey, valueKey?: keyof TypeConfiguration[ConfigKey])  => {
    return (target: any, attribute: string) => {

    }
};

/**
 * return all the configuration data for current application
 * @returns 
 */
export const getApplicationConfig = (): TypeConfiguration => {
    return {} as any;
}

export * from "./IConfigApplication";
export * from "./IConfigCrossSite";
export * from "./IConfigDB";
export * from "./IConfigEmail";
export * from "./IConfigLog";
export * from "./IConfigServer";