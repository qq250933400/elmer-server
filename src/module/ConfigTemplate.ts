import { initConfigSchema } from "../config";
import { Schema } from "../core/Schema";
import { Autowired, utils } from "elmer-common";
import * as fs from "fs";
import * as path from "path";
import * as YAML from "yaml";

export class ConfigTemplate {
    @Autowired()
    private schemaObj: Schema;

    private tempSchema: any = {};
    constructor() {
        initConfigSchema();
    }
    init() {
        const configSchema = initConfigSchema();
        this.tempSchema = configSchema || {};
        // Application config
        const serverFile = path.resolve(process.cwd(), "./config.yml");
        if(!fs.existsSync(serverFile)) {
            const serverConfig = this.schemaToData(["Application"], configSchema);
            const ApplicationConfigText = YAML.stringify(serverConfig.Application, {
                "indent": 2
            });
            fs.writeFileSync(serverFile, ApplicationConfigText, { encoding: "utf8" });
        }
        // crossSite config
        const crossSiteFile = path.resolve(process.cwd(), "./crossSite.json");
        if(!fs.existsSync(crossSiteFile)) {
            const crossSiteConfig = this.schemaToData(["CrossSite"], configSchema);
            fs.writeFileSync(crossSiteFile, JSON.stringify(crossSiteConfig.CrossSite, null, 4), { encoding: "utf8" });
        }
    }
    private schemaToData(names: string[], schemaData: any) {
        const data:any = {};
        names.forEach((name) => {
            data[name] = this.schemaConvert(schemaData[name]);
        });
        return data;
    }
    private schemaConvert(schemaData: any) {
        if(schemaData && schemaData.properties) {
            const resultData = {};
            if(schemaData.dataType) {
                Object.keys(schemaData.dataType).forEach((dataKey) => {
                    this.tempSchema[dataKey] = schemaData.dataType[dataKey];
                });
            }
            Object.keys(schemaData.properties).forEach((attrKey: string) => {
                const attrConfig = schemaData.properties[attrKey];
                const attrType = attrConfig.type;
                if(/^\#/.test(attrType)) {
                    const newType = attrType.replace(/^#/,"");
                    const newTypeConfig = this.tempSchema[newType];
                    resultData[attrKey] = this.schemaConvert(newTypeConfig);
                } else if(/^Array\<\#[a-zA-Z0-9]{1,}\>$/.test(attrType)){
                    const newType = attrType.replace(/^Array\<\#([a-zA-Z0-9]{1,})\>$/, "$1");
                    const newTypeConfig = this.tempSchema[newType];
                    const newData = this.schemaConvert(newTypeConfig);
                    resultData[attrKey] = newData ? [newData] : [];
                } else if(utils.isRegExp(attrType)){
                    resultData[attrKey] = attrConfig.defaultValue || attrConfig.default || "RegExp";
                } else if(attrType === "Object") {
                    resultData[attrKey] = this.schemaConvert(attrConfig);
                } else if(/^Array\<[a-zA-Z]{1,}\>$/.test(attrType)) {
                    resultData[attrKey] = attrConfig.defaultValue || attrConfig.default || [];
                } else if(utils.isArray(attrType)) {
                    resultData[attrKey] = attrConfig.defaultValue || attrConfig.default || attrType;
                } else {
                    resultData[attrKey] = attrConfig.defaultValue || attrConfig.default || "";
                }
            });
            return resultData;
        } else {
            if(schemaData.type) {
                return schemaData.defaultValue || schemaData.default || "";
            }
        }
    }
}