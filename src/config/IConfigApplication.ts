import { IConfigDB } from "./IConfigDB";
import { IConfigServer } from "./IConfigServer";
import { IConfigLog } from "./IConfigLog";

export interface IConfigApplication {
    Server: IConfigServer;
    DB: IConfigDB;
    Log: IConfigLog;
}
