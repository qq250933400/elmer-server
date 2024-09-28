import { createStateActions } from "../core/StateManage";
import { IConfigOption } from "../config/IConfiguration";
import { IConfigApplication } from "../../Config/interface/IConfigApplication";

interface IConfigState extends IConfigApplication, IConfigOption {
    
}

export type TypeConfigStateData = Partial<IConfigState>;

export const configState = createStateActions<TypeConfigStateData>("applicationConfig", {
    Server: null,
    DataBase: null,
    Email: null,
    Log: null,
    Security: null,
    Session: null,
    others: null
});