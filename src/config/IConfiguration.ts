import { IConfigCrossSite } from "./IConfigCrossSite";

export interface IConfigOption {
    Security: IConfigCrossSite;
}

export type TypeConfigOptionKey = keyof IConfigOption | undefined;