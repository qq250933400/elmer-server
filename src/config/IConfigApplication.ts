import { IConfigDB } from "./IConfigDB";
import { IConfigServer } from "./IConfigServer";

export interface IConfigApplication {
    Server: IConfigServer;
    DB: IConfigDB;
}
