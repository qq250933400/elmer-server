import { Express,Request, Response } from "express";
import * as expressSession from "express-session";
import { utils, queueCallFunc } from "elmer-common";
import { CONST_DECORATOR_FOR_MODULE_INSTANCEID } from "../data";
import { createInstance, AppService } from "./Module";
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
    private logger: Logger;

    public main(app: Express): void {
        this.logger.info("application complete");
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
const invokeMain = (instance: IApplication, application: IApplication, app: Express): void => {
    const srcMain = instance.main;
    const logger:Logger = GetLogger(instance);
    instance.main = () => {
        queueCallFunc([{
                id: "RunAppliation",
                fn: () => {
                    return com.invoke(application.main, app);
                }
            }, {
                id: "injectMain",
                fn: () => {
                    if(typeof srcMain === "function") {
                        return com.invoke(srcMain, app);
                    } else {
                        return null;
                    }
                }
            }
        ]).then(() => {
            logger.info(`Application runing: ${app}`);
        }).catch((err) => {
            logger.error(err);
        });
    }
    instance.main(app);
};

export const invokeApplication = (instance: IApplication, app: Express) => {
    const instanceId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, instance);
    const application = createInstance(Application, instanceId);
    invokeSession(app);
    invokeMain(instance, application, app);
};