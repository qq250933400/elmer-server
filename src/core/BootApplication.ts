import "reflect-metadata";
import {
    CONST_DECORATOR_FOR_MODULE_BOOTAPPLICATION,
    CONST_BOOTAPPLICATION_MODULE_FLAG
} from "../data";
import { AppService } from "./Module";
import { invokeApplication } from "./Application";

// const crossSiteConfig = (app:Express) => {
//     app.all('*', (req: Request, res: Response, next) => {
//         const eventObj = {
//             continue: true
//         };
//         eventObj.continue && next();
//     });
//     app.use(expressSession({
//         genid: () => utils.guid(),
//         secret: "ExpressApplication",
//         cookie: {
//             maxAge: 60000
//         }
//     }));
// };


export const BootApplication = (Target: new(...args:any) => any): void => {
    AppService(Target);
    Reflect.defineMetadata(CONST_DECORATOR_FOR_MODULE_BOOTAPPLICATION, CONST_BOOTAPPLICATION_MODULE_FLAG, Target);   
}

export const startApplication = <T={}>(App: new(...args:any) => any ): T => {
    const bootApplicationFlag = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_BOOTAPPLICATION, App);
    if(bootApplicationFlag !== CONST_BOOTAPPLICATION_MODULE_FLAG) {
        throw new Error("Application模块需要使用BootApplication装饰器装载。");
    } else {
        return invokeApplication(App) as any;
    }
}