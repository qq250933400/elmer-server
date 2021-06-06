import { DBConfig, LogConfig } from "../config";
import { IConfigDB } from "../config/IConfigDB";
import { IConfigLog } from "../config/IConfigLog";

export abstract class ADataBase {

    @DBConfig()
    config: IConfigDB;
    @LogConfig()
    logConfig: IConfigLog;

    abstract connect(): void;
    abstract dispose(): void;
}
