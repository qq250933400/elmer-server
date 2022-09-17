import com from "../utils/utils";
import * as express from "express";
import * as expressSession from "express-session";
import * as cookieParser from "cookie-parser";
import { json } from 'body-parser';
import { Express, Request, Response } from "express";
import { utils, queueCallFunc } from "elmer-common";
import { CONST_DECORATOR_FOR_MODULE_INSTANCEID } from "../data";
import { createInstance, AppService } from "./Module";
import { IConfigServer, GetConfig } from "../config";
import { Logger, GetLogger } from "../logs";
import { StateStore } from "./StateManage";
import { configState } from "../data/config";
import { RouterController } from "../Controller/RouterController";


interface IApplication {
    main(app: Express): void;
}

@StateStore(configState)
@AppService
class Application implements IApplication {
    @GetConfig("Server")
    public serverConfig: IConfigServer;

    @GetLogger
    public logger: Logger;

    constructor(
        private controller: RouterController
    ) {
        console.log("controller", this.controller);
    }
    public main(app: Express): any {
        return new Promise((resolve) => {
            app.use(expressSession({
                genid: () => {
                    const uid = utils.guid();
                    console.log("general session id",uid);
                    return uid;
                },
                secret: this.serverConfig.publicKey || "Elmer-Server",
                cookie: {
                    maxAge: 60000
                }
            }));
            app.use(json());
            this.controller.routeListen(app);
            resolve({});
        });
    }
    public listen(app: Express): void {
        app.listen(
            this.serverConfig.port || 80,
            this.serverConfig.host || "0.0.0.0"
        );
    }
}

const invokeSession = (app: Express) => {
    app.use(expressSession({
        genid: () => "elmer_server_" + utils.guid(),
        secret: "ExpressApplication",
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 60000,
            secure: true
        }
    }));
}
const invokeMain = (instance: IApplication, application: Application, app: Express): void => {
    const srcMain = instance.main;
    instance.main = () => {
        queueCallFunc([{
                id: "RunAppliation",
                fn: () => {
                    return com.invoke.call(application, application.main, app);
                }
            }, {
                id: "ConfigMain",
                fn: () => {
                    if(typeof srcMain === "function") {
                        return com.invoke.call(instance, srcMain, app);
                    } else {
                        return null;
                    }
                }
            }, {
                id: "startListen",
                fn: (): any => {
                    return application.listen(app);
                }
            }
        ], undefined, {
            throwException: true
        }).then(() => {
            application.logger.info(`Application runing: http://${application.serverConfig?.host}:${application.serverConfig?.port}`);
        }).catch((err) => {
            application.logger.error(err.exception || err);
        });
    }
    instance.main(app);
};

export const invokeApplication = (ConfigApplication: new(...args:any) => any, ) => {
    const httpApp:Express = express();
    const application = createInstance(Application);
    const instanceId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, application);
    const configApplication = createInstance(ConfigApplication, instanceId);
    invokeSession(httpApp);
    invokeMain(configApplication, application, httpApp);
    return application;
};