import "reflect-metadata";
import DefineDecorator from "../core/DefineDecorator";
import GlobalStore from "../core/GlobalStore";
import { Schema } from "../core/Schema";
import * as fs from "fs";
import * as path from "path";
import { parse } from "yaml";
import ApplicationConfigSchema from "./config.schema.application";
import DBConfigSchema from './config.schema.db';
import ServerConfigSchema from './config.schema.server';
import LogConfigSchema from "./config.schema.log";
import utils from "../core/utils";
import { IConfigApplication } from "./IConfigApplication";
import { StaticCommon } from "elmer-common";

const readConfigData = (fileName: string):any => {
    const txt = fs.readFileSync(fileName, "utf8");
    if(/\.yml/i.test(fileName)) {
        return parse(txt);
    } else if(/\.json/i.test(fileName)) {
        return JSON.parse(txt);
    }
};
/**
 * 读取配置，支持yml,json两种数据格式
 * @param fileName 配置文件相对路径
 * @param name 配置保存名称,Application, DB, Server
 * @param schema 检验规则[可选]
 * @returns 
 */
export const Config = (fileName: string, name?: string, schema?: any) => {
    return (Target: new(...args: any[]) => any) => {
        DefineDecorator(() => {
            const localFile = path.resolve(process.cwd(), fileName);
            if(fs.existsSync(localFile)) {
                const configData = readConfigData(localFile);
                const saveName = name || "Application";
                const schemaObj = GlobalStore.getService<Schema>(Schema);
                schemaObj.addSchema("Application", ApplicationConfigSchema);
                schemaObj.addSchema("DB", DBConfigSchema);
                schemaObj.addSchema("Server", ServerConfigSchema);
                schemaObj.addSchema("Log", LogConfigSchema);
                if(schema && utils.isEmpty(name)) {
                    schemaObj.addSchema(name, schema);
                }
                if(saveName === "Application") {
                    schemaObj.validate(configData, ApplicationConfigSchema, "Application");
                } else {
                    schemaObj.validate(configData, saveName);
                }
                GlobalStore.setConfig(saveName, configData);
            } else {
                throw new Error("指定配置文件不存在。");
            }
        }, Target);
    }
};

export const getApplicationConfig = ():IConfigApplication => {
    return GlobalStore.getConfig("Application");
};

export const DBConfig = () => {
    return (Target: any, attr: string) => {
        Object.defineProperty(Target, attr, {
            configurable: false,
            enumerable: true,
            get: () => GlobalStore.getConfig("Application")?.DB,
            set: () => {
                throw new Error("Can not override db config.");
            }
        });
    }
};


export const LogConfig = () => {
    return (Target: any, attr: string) => {
        Object.defineProperty(Target, attr, {
            configurable: false,
            enumerable: true,
            get: () => GlobalStore.getConfig("Application")?.Log || {level: "error"},
            set: () => {
                throw new Error("Can not override db config.");
            }
        });
    }
};

export const GetConfig = (Key: string) => {
    return (Target: any, attr: string) => {
        Object.defineProperty(Target, attr, {
            configurable: false,
            enumerable: true,
            get: () => {
                const config = GlobalStore.getConfig("Application").Server;
                return StaticCommon.getValue(config, Key);
            },
            set: () => {
                throw new Error("Can not override db config.");
            }
        });
    }
}