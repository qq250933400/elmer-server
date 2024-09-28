import { IConfigDB } from "./IConfigDB";
import { IConfigServer } from "./IConfigServer";
import { IConfigLog } from "./IConfigLog";
import { IConfigEmail } from "./IConfigEmail";
import { IConfigSession } from "./IConfigSession";

export * from "./IConfigApplication";

export type IConfiguration = {
    IConfigDB: IConfigDB;
    IConfigServer: IConfigServer;
    IConfigLog: IConfigLog;
    IConfigEmail: IConfigEmail;
    IConfigSession: IConfigSession;
};
