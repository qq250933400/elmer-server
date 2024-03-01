import { Autowired } from "elmer-common";
import { Controller, RequestMapping, ExceptionHandler, GetRequestBody, utils, Email, GetConfig, IConfigServer, StaticFiles, GetResponse } from "../../src";
import { Response } from "express";

type TypeRequestBody = {
    text: string;
};


@Controller("api")
export class Api {

    @GetConfig("Server")
    private config: IConfigServer;

    constructor(
        private fileObj: StaticFiles,
        private email: Email
    ) {}

    @RequestMapping("/guid", "GET")
    guid(@GetResponse response: Response) {
        response.status(400);
        console.log("---UpdateRouterStatus--", 400);
        throw new Error("Error Handle");
        return {
            uuid: utils.guid()
        };
    }
    @RequestMapping("/encode", "POST")
    encode(@GetRequestBody() body: TypeRequestBody) {
        return utils.aseEncode(body.text, this.config.publicKey);
    }

    @RequestMapping("/email", "GET")
    sendEmail() {
        return this.email.send({
            toUsers: ["250933400@qq.com"],
            // ccUsers: ["elmer_mo@163.com"],
            text: "尊敬的用户您好，你的账号已开通。",
            subject: "会员注册"
        });
    }

    @RequestMapping("/upload", "POST")
    uploadTest() {
    }
    @RequestMapping("/db/text", "GET")
    otherExec() {
        console.log("otherExec");
    }
    @RequestMapping("/test/json", "GET")
    testJSON() {
        return this.fileObj.readJson("./test.json");
    }
    @ExceptionHandler()
    private exceptionHandler() {
        return {
            message: "new handler"
        }
    }
}
