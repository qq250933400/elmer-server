import { AppService } from "../../Annotation/index";
import { META_KEY_CONFIG_INFO } from "../../data/constants";
import { parse } from "yaml";
import { IConfigApplication } from "../../Config/interface";

import fs from "fs";
import lodash from "lodash";
import { Adapter } from "./Adapter";
import { Log } from "./Log";

interface IConfigInfo {
    id: string;
    data: {
        base: string,
        env: string
    }
}

@AppService
export class Application {
    public configuration: IConfigApplication;

    constructor(private log: Log) {}
    init(bootApp: any) {
        this.loadConfig(bootApp);
    }
    start(adapter: Adapter) {
        try {
            adapter.on("ready", (url: string) => {
                console.log(`Application is running at ${url}`);
                this.log.info(`Application is running at ${url}`);
            });
            adapter.on("error", (err: any) => {
                console.error(err);
                this.log.error(err.message, err.stack);
            });
            adapter.init(this.configuration);
            adapter.listen();
        } catch(e) {
            console.error(e);
            this.log.error(e.message, e.stack);
        }
    }
    private loadConfig(bootApp: any) {
        const configInfoData: IConfigInfo[] = Reflect.getMetadata(META_KEY_CONFIG_INFO, bootApp.constructor) || [];
        const configData: any = {};
        configInfoData.forEach(configInfo => {
            const { data: { base, env } } = configInfo;
            const baseConfig = this.readConfigData(base);
            const envConfig = this.readConfigData(env);
            lodash.merge(configData, baseConfig, envConfig || {});
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

