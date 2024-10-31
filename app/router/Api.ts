import { Controller, RequestMapping, AppModel, Redis, GetParam, Exception, Get, Validation, RBValidate, JsonToType, UtilsService } from "../../src";
import { utils } from "../../src";
import { Response } from "express";
import { Test, Options } from "./Test";

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
@AppModel(Test, Options, JsonToType, UtilsService, Redis)
@Controller("/api")
export class Api {

    constructor(
        private test: Test,
        private msjOptions: Options,
        private jsonToType: JsonToType,
        private utilsService: UtilsService,
        private redis: Redis
    ) {
        
    }

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
        { type: "Cookie", args: "AuthId" },
        { type: "Body" }
    ])
    @RequestMapping("/encode", "POST")
    async encode(body: TypeRequestBody, queryParams: any, lang: string, AuthId: string, bodyData: any) {
        console.log("requestBody: ",body);
        console.log("requesyQuery: ", queryParams);
        console.log("accept-language", lang);
        console.log("AuthId: ", AuthId);
        console.log(await this.msjOptions.getOptions());
        console.log("___Password___", this.utilsService.aseEncode("elmer_mo"));
        const ssid = await this.redis.get('SSIDX',0);
        console.log("---SSID---", ssid);
        if(!ssid) {
            const res = await this.redis.set("SSIDX", 'ELMER_MO', {
                database: 0,
                expire: 60
            });
            console.log(res);
        }
        // await this.redis.delete("SSIDX");
        this.redis.quit(0);
        // return utils.aseEncode(body.text, this.config.publicKey);
        if(bodyData) {
            return this.jsonToType.toType(bodyData, "IRequestBody");
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
