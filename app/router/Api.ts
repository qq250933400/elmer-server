import { Controller, RequestMapping, RequestBody, utils,  } from "../../src";

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

}