import { Express,Request, Response } from "express";
import * as express from "express";
import * as expressSession from "express-session";
import { utils, queueCallFunc } from "elmer-common";
import { CONST_DECORATOR_FOR_MODULE_INSTANCEID } from "../data";
import { createInstance, AppService, onInit } from "./Module";
import com from "../utils/utils";
import { IConfigServer, GetConfig } from "../config";
import { Logger, GetLogger } from "../logs";
import { StateStore } from "./StateManage";
import { configState } from "../data/config";


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

    public main(app: Express): void {
        this.logger.info("Method not implements");
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
                    return com.invoke(application.main, app);
                }
            }, {
                id: "ConfigMain",
                fn: () => {
                    if(typeof srcMain === "function") {
                        return com.invoke(srcMain, app);
                    } else {
                        return null;
                    }
                }
            }
        ]).then(() => {
            application.logger.info(`Application runing: http://${application.serverConfig.host}:${application.serverConfig.port}`);
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