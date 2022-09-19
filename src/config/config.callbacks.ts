import * as path from "path";

export interface IFormatCallbacks {
    formatPath: (val: string) => string;
}

export const callbacks: IFormatCallbacks = {
    formatPath: (val: string) => {
        return path.resolve(process.cwd(), val);
    }
};
