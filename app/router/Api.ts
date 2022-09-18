import { Autowired } from "elmer-common";
import { Controller, RequestMapping, GetRequestBody, utils, Email, GetConfig } from "../../src";
import { TestModel } from "../model/TestModel";

type TypeRequestBody = {
    text: string;
};


@Controller("api")
export class Api {
    @Autowired()
    private email: Email;
    @GetConfig("Email")
    private config: any;

    @RequestMapping("/guid", "GET")
    guid() {
        return {
            uuid: utils.guid()
        };
    }
    @RequestMapping("/encode", "POST")
    encode(@GetRequestBody() body: TypeRequestBody) {
        return utils.aseEncode(body.text);
    }

    @RequestMapping("/email", "POST")
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
}
