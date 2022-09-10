import { Express,Request, Response } from "express";
import * as expressSession from "express-session";
import { utils } from "elmer-common";

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
const invokeMain = (instance: IApplication, app: Express): void => {
    const srcMain = instance.main;
    instance.main = () => {
        console.log("start application");
    }
    instance.main(app);
};

export interface IApplication {
    main(app: Express): void;
}

export const invokeApplication = (instance: IApplication, app: Express) => {
    invokeSession(app);
    invokeMain(instance, app);
};