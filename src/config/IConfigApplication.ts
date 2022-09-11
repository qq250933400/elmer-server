import { IConfigDB } from "./IConfigDB";
import { IConfigServer } from "./IConfigServer";
import { IConfigLog } from "./IConfigLog";
import { IConfigEmail } from "./IConfigEmail";

export interface IConfigApplication {
    Server: IConfigServer;
    DataBase: IConfigDB;
    Log: IConfigLog;
    Email: IConfigEmail;
}
