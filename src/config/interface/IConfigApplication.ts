import { IConfigDB } from "./IConfigDB";
import { IConfigServer } from "./IConfigServer";
import { IConfigLog } from "./IConfigLog";
import { IConfigEmail } from "./IConfigEmail";
import { IConfigSession } from "./IConfigSession";
import { IConfigCrossSite } from "./IConfigCrossSite";

export interface IConfigApplication {
    Server: IConfigServer;
    DataBase: IConfigDB;
    Log: IConfigLog;
    Email: IConfigEmail;
    Session: IConfigSession;
    Security: IConfigCrossSite;
}
