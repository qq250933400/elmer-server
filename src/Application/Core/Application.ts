import { AppService, AppModel } from "../../Annotation/index";
import { META_KEY_CONFIG_INFO } from "../../data/constants";
import { parse } from "yaml";
import { IConfigApplication } from "../../Config/interface";
import { Param } from "../../Annotation/module";

import fs from "fs";
import lodash from "lodash";
import { Adapter } from "./Adapter";
import { Log } from "./Log";
import {
    META_KEY_MODULE_ID,
    META_KEY_INSTANCE_ID
} from "../../data/constants";
import { v7 as uuid } from "uuid";

interface IConfigInfo {
    id: string;
    data: {
        base: string,
        env: string,
        rootPath: string;
    }
}

@AppModel(Log)
@AppService
export class Application {
    public configuration: IConfigApplication = {} as any;
    constructor(private log: Log) {
        
    }
    init(bootApp: any) {
        this.loadConfig(bootApp);
    }
    start(adapter: Adapter) {
        try {
            const adapterId = uuid();
            Reflect.defineMetadata(META_KEY_MODULE_ID, adapterId, adapter);
            Reflect.defineMetadata(META_KEY_INSTANCE_ID, Reflect.getMetadata(META_KEY_INSTANCE_ID, this), adapter);
            adapter.on("ready", (url: string) => {
                console.log(`Application is running at ${url}`);
                this.log.info(`Application is running at ${url}`);
            });
            adapter.on("error", (err: any) => {
                console.error(err);
                this.log.error(err.message, err.stack);
            });
            adapter.init(this.configuration);
            adapter.loadRouter(this.log);
            adapter.listen(this.log);
        } catch(e: any) {
            console.error(e);
            this.log.error(e.message, e.stack);
        }
    }
    private loadConfig(bootApp: any) {
        const configInfoData: IConfigInfo[] = Reflect.getMetadata(META_KEY_CONFIG_INFO, bootApp.constructor) || [];
        const configData: any = {};
        configInfoData.forEach(configInfo => {
            const { data: { base, env, rootPath }  } = configInfo;
            const baseConfig = this.readConfigData(base);
            const envConfig = this.readConfigData(env);
            lodash.merge(configData, baseConfig, envConfig || {}, {
                rootPath
            });
        });
        this.configuration = configData;
    }
    private readConfigData(fileName: string):any {
        if(fs.existsSync(fileName)) {
            const txt = fs.readFileSync(fileName, "utf8");
            if(/\.yml/i.test(fileName)) {
                return parse(txt);
            } else if(/\.json/i.test(fileName)) {
                return JSON.parse(txt);
            }
        }
    };
}

