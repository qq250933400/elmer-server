import { Controller, RequestMapping, GetConfig, GetParam, Exception, Get, Validation, RBValidate } from "../../src";
import { utils } from "../../src";
import { Response } from "express";

type TypeRequestBody = {
    text: string;
    orderNo: string;
    orderId: number;
    details: {
        count: number;
    }
};

const orderSchema = Validation.defineSchema<{ length: number, minLength: number }, {}, TypeRequestBody>({
    orderNo: {
        type: "String",
        length: 14,
        "required": true
    },
    orderId: {
        type: "Number",
        required: true
    },
    text: {
        type: "String",
        minLength: 10
    },
    details: {
        type: "Object",
        required: true,
        properties: {
            count: {
                type: "Number",
                required: true
            }
        }
    }
})

@Controller("/api")
export class Api {

    constructor(
        // private fileObj: StaticFiles,
        // private email: Email
    ) {}

    @Get("/guid")
    guid(response: Response) {
        // response.status(400);
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({
                    uuid: utils.default.uuid()
                });
            }, 1000);
        });
    }
    @RBValidate(orderSchema.data, orderSchema.format)
    @GetParam([
        { type: "Body", args: "orderNo" },
        { type: "QueryParam", args: "orderNo"},
        { type: "Header", args: "Accept-Language"},
        { type: "Cookie", args: "AuthId" }
    ])
    @RequestMapping("/encode", "POST")
    encode(body: TypeRequestBody, queryParams: any, lang: string, AuthId: string) {
        console.log("requestBody: ",body);
        console.log("requesyQuery: ", queryParams);
        console.log("accept-language", lang);
        console.log("AuthId: ", AuthId);
        // return utils.aseEncode(body.text, this.config.publicKey);
        return {
            value: "hello world"
        }
    }

    @RequestMapping("/email", "GET")
    sendEmail() {
        // return this.email.send({
        //     toUsers: ["250933400@qq.com"],
        //     // ccUsers: ["elmer_mo@163.com"],
        //     text: "尊敬的用户您好，你的账号已开通。",
        //     subject: "会员注册"
        // });
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
        // return this.fileObj.readJson("./test.json");
    }
    @GetParam([
        { type: "PathParam", args: "id"}
    ])
    @RequestMapping("/api/:id", "GET")
    testApi(id: string) {
        console.log("----demo-api", id);
        return "New Resonsee";
    }
}
