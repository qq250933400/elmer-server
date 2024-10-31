import { IConfigDB } from "./IConfigDB";
import { IConfigServer } from "./IConfigServer";
import { IConfigLog } from "./IConfigLog";
import { IConfigEmail } from "./IConfigEmail";
import { IConfigSession } from "./IConfigSession";
import { IConfigCrossSite } from "./IConfigCrossSite";
import { IConfigRedis } from "./IConfigRedis";

export interface IConfigApplication {
    Server: IConfigServer;
    DataBase: IConfigDB;
    Log: IConfigLog;
    Email: IConfigEmail;
    Session: IConfigSession;
    Security: IConfigCrossSite;
    Redis: IConfigRedis;
}
