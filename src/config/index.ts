import "reflect-metadata";
import * as fs from "fs";
import * as path from "path";
import { parse } from "yaml";
import ApplicationConfigSchema from "./config.schema.application";
import DBConfigSchema from './config.schema.db';
import ServerConfigSchema from './config.schema.server';
import LogConfigSchema from "./config.schema.log";
import CrossSiteConfigSchema from "./config.schema.crossSite";
import EmailConfigSchema from "./config.schema.email";
import SessionConfigSchema from "./config.schema.session";
import utils from "../utils/utils";
import { IConfigApplication } from "./IConfigApplication";
import { TypeConfigOptionKey, IConfigOption } from "./IConfiguration";
import { getObjFromInstance, delegateInit } from "../core/Module";
import { StateManage } from "../core/StateManage";
import { configState, TypeConfigStateData } from "../data/config";
import { Schema } from "../core/Schema";

type TypeConfiguration = IConfigApplication & IConfigOption;

const readConfigData = (fileName: string):any => {
    const txt = fs.readFileSync(fileName, "utf8");
    if(/\.yml/i.test(fileName)) {
        return parse(txt);
    } else if(/\.json/i.test(fileName)) {
        return JSON.parse(txt);
    }
};

const loadConfigSchema = (Target: new(...args: any[]) => any) => {
    const schemaObj: Schema = getObjFromInstance(Schema as any, Target);
    schemaObj.addSchema("Application", ApplicationConfigSchema);
    schemaObj.addSchema("DataBase", DBConfigSchema);
    schemaObj.addSchema("Server", ServerConfigSchema);
    schemaObj.addSchema("Log", LogConfigSchema);
    schemaObj.addSchema("Security", CrossSiteConfigSchema);
    schemaObj.addSchema("Email", EmailConfigSchema);
    schemaObj.addSchema("Session", SessionConfigSchema);
    return {
        Application: ApplicationConfigSchema,
        DataBase: DBConfigSchema,
        Server: ServerConfigSchema,
        Log: LogConfigSchema,
        Security: CrossSiteConfigSchema,
        Email: EmailConfigSchema,
        Session: SessionConfigSchema
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
        delegateInit((targetObj: any) => {
            const localFile = path.resolve(process.cwd(), fileName);
            if(fs.existsSync(localFile)) {
                const configData = readConfigData(localFile);
                const saveName = name || "Application";
                const schemaObj: Schema = getObjFromInstance(Schema as any, targetObj);
                const stateObj: StateManage = getObjFromInstance(StateManage as any, targetObj);
                const stateActions = stateObj.invoke<TypeConfigStateData>(configState.stateName);
                loadConfigSchema(targetObj);
                if(schema && !utils.isEmpty(name)) {
                    schemaObj.addSchema(name, schema);
                }
                if(name === "Security") {
                    schemaObj.validate(configData, saveName);
                    stateActions.Security.set(schemaObj.format(configData, schemaObj.getSchemas().Security) as any);
                } else if(utils.isEmpty(name)) {
                    schemaObj.validate(configData, saveName);
                    stateActions.Server.set(schemaObj.format(configData?.Server, schemaObj.getSchemas().Server) as any);
                    stateActions.DataBase.set(schemaObj.format(configData?.DataBase, schemaObj.getSchemas().DataBase) as any);
                    stateActions.Log.set(schemaObj.format(configData?.Log || {}, schemaObj.getSchemas().Log) as any);
                    stateActions.Email.set(schemaObj.format(configData?.Email || {}, schemaObj.getSchemas().Email) as any);
                    stateActions.Session.set(schemaObj.format(configData?.Session || {}, schemaObj.getSchemas().Session) as any);
                } else {
                    const otherConfig = stateActions.others.get() || {};
                    otherConfig[name] = configData;
                    stateActions.others.set(otherConfig);
                }
            } else {
                throw new Error("指定配置文件不存在。");
            }
        })(Target);
    }
};

export const GetConfig = <ConfigKey extends keyof TypeConfiguration>(configKey: ConfigKey, valueKey?: keyof TypeConfiguration[ConfigKey])  => {
    return (target: any, attribute: string) => {
        Object.defineProperty(target, attribute, {
            get: () => {
                const stateObj: StateManage = getObjFromInstance(StateManage as any, target);
                const stateActions = stateObj.invoke<TypeConfigStateData>(configState.stateName);
                const configValue = stateActions[configKey].get();
                return utils.isEmpty(valueKey) ? configValue : utils.getValue(configValue, valueKey as string);
            }
        });
    }
};
/**
 * 自定义配置数据
 * @param configKey
 * @returns 
 */
export const GetUserConfig = <T={}>(configKey: keyof T) => {
    return (target: any, attribute: string) => {
        Object.defineProperty(target, attribute, {
            get: () => {
                const stateObj: StateManage = getObjFromInstance(StateManage as any, target);
                const stateActions = stateObj.invoke<TypeConfigStateData>(configState.stateName);
                const configValue = stateActions.others.get();
                return utils.isEmpty(configKey) ? null : utils.getValue(configValue, configKey as string);
            }
        });
    }
}

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
export * from "./IConfigSession";