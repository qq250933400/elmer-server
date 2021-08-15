import { Controller, RequestMapping, RequestBody, utils, AddInterceptors } from "../../src";

type TypeRequestBody = {
    text: string;
};


@Controller("api")
export class Api {

    @RequestMapping("/guid", "GET")
    guid() {
        return {
            uuid: utils.guid()
        };
    }
    @RequestMapping("/encode", "POST")
    encode(@RequestBody body: TypeRequestBody) {
        console.log(body, "----");
        return utils.aseEncode(body.text);
    }

    @AddInterceptors
    beforeRequest() {
        return {
            statusCode: 401,
            UnAuth: true
        }
    }

    @RequestMapping("/upload", "POST")
    uploadTest() {
        
    }
}
console.log("---++--")