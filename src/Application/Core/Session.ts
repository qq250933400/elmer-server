import { AppService, AppModel } from "../../Annotation";
import { Redis } from "../Redis";
import { UtilsService } from "../../Module/UtilsService";

import utils from "../../utils/utils";

interface ISessionSaveOption {
    expire?: number;
}

@AppModel(Redis, UtilsService)
@AppService
export class Session {

    sessionStorage: "file"|"redis" = "redis";
    constructor(
        private readonly redis: Redis,
        private readonly utils: UtilsService
    ) {}
    start(ssid: string) {
        const ssidKey = this.utils.md5(`session_${ssid}`);
        if(utils.isEmpty(ssid)) {
            throw new Error("ssid cannot be empty, missing ssid in request cookie data");
        }
        return {
            set: (key: string, value: string|number, option?: ISessionSaveOption) => {
                const saveDataKey = ssidKey + "_" + key;
                if(this.sessionStorage === "redis") {
                    this.redis.set(saveDataKey, value, {
                        expire: option?.expire || this.utils.config.sessionExpired || 300
                    });
                }
            },
            get: (key: string) => {
                const saveDataKey = ssidKey + "_" + key;
                if(this.sessionStorage === "redis") {
                    return this.redis.get(saveDataKey);
                } else {
                    Promise.reject("session storage type is not support yet.");
                }
            }
        };
    }
}
