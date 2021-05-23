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

export const Config = (fileName: string, name?: string, schema?: any) => {
    return (Target) => {
        DefineDecorator(() => {
            const localFile = path.resolve(process.cwd(), fileName);
            if(fs.existsSync(localFile)) {
                const txt = fs.readFileSync(localFile, "utf-8");
                const configData = parse(txt);
                const saveName = name || "Application";
                const schemaObj = GlobalStore.getService<Schema>(Schema);
                schemaObj.addSchema("Application", ApplicationConfigSchema);
                schemaObj.addSchema("DB", DBConfigSchema);
                schemaObj.addSchema("Server", ServerConfigSchema);
                if(saveName === "Application") {
                    schemaObj.validate(configData, ApplicationConfigSchema);
                } else {
                    schemaObj.validate(configData)
                }
                GlobalStore.setConfig(saveName, configData);
            } else {
                throw new Error("指定配置文件不存在。");
            }
        }, Target);
    }
}