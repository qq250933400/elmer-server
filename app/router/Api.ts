import { Autowired } from "elmer-common";
import { Controller, RequestMapping, RequestBody, utils, AddInterceptors, Email, GetDataModel } from "../../src";
import { TestModel } from "../model/TestModel";

type TypeRequestBody = {
    text: string;
};


@Controller("api")
export class Api {
    @Autowired()
    private email: Email;

    @RequestMapping("/guid", "GET")
    guid() {
        return {
            uuid: utils.guid()
        };
    }
    @RequestMapping("/encode", "POST")
    encode(@RequestBody body: TypeRequestBody) {
        console.log(this, body, "----");
        return utils.aseEncode(body.text);
    }

    @AddInterceptors
    public beforeRequest(@RequestBody body: TypeRequestBody) {
        console.log("BeforeRequestHeader", body);
        this.otherExec();
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
    dbTest(
        @GetDataModel(TestModel) testMD: TestModel
    ) {
        return testMD.test();
    }
    private otherExec() {
        console.log("otherExec");
    }
}
