import { Adapter } from "./Adapter";
import { json } from 'body-parser';
import utils from "../../utils/utils";
import express, { Express, Response, Request } from "express";
import { createRequestRoutes, IDefineRequestParam, IDefineRoute } from "../Request/Annotation";

export class ExpressAdapter extends Adapter {
    
    private app: Express;
    constructor() {
        super();
        this.app = express();
    }
    public listen() {
        const serverConfig = this.configuration?.Server;
        if(!serverConfig) {
            throw new Error("未正确加载配置信息！");
        }
        if(utils.isEmpty(serverConfig?.staticRoute)) {
            this.app.use(express.static(serverConfig.staticPath));
        } else {
            this.app.use(serverConfig?.staticRoute, express.static(serverConfig.staticPath));
        }
        this.app.on("error", (err) => {
            this.emit("error", err);
        });
        this.app.on("close", () => {
            this.emit("close");
        });
        this.app.on("ready", () => {
            this.emit("ready");
        });
        this.app.listen(serverConfig.port, serverConfig.host, () => {
            this.emit("ready", `http://${serverConfig.host}:${serverConfig.port}`);
        });
    }
    get(url: string, handler: Function): void {
        this.app.get(url, handler as any);
    }
    post(url: string, handler: Function): void {
        this.app.post(url, handler as any);
    }
    use(handler: Function): void {
        this.app.use(handler as any);
    }
    options(url: string, handler: Function): void {
        this.app.options(url, handler as any);
    }
    delete(url: string, handler: Function): void {
        this.app.delete(url, handler as any);
    }
    put(url: string, handler: Function): void {
        this.app.put(url, handler as any);
    }
    getParam(opt: IDefineRequestParam[], route: IDefineRoute ,req: Request, res: Response): any[] {
        const params: any[] = [];
        opt.forEach((item) => {
            switch(item.type) {
                case 'PathParam': {
                    const fieldId = item.args;
                    const pathArr = route.url.split("/");
                    const urlArr = req.url.split("/");
                    const matchIndex = pathArr.indexOf(`:${fieldId}`);
                    if(matchIndex > 0) {
                        params.push(urlArr[matchIndex]);
                    }
                    break;
                }
            }
        })
        return params;
    }
    public loadRouter() {
         
         
        createRequestRoutes(this, (req, res, next) => {
            // crossorigin check
        }, (responseData: Promise<any>, req: Request, res: Response, next) => {
            responseData.then((data) => {
                console.log("==========Response success=======", data);
                res.send(data);
            }).catch((error) => {
                console.error(error);
                res.status(500);
                res.send({
                    message: error.message
                });
            });
        });
    }
}
