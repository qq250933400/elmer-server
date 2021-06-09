import { Controller, RequestMapping, RequestBody, utils,  } from "../../src";
import { StaticCommon } from "elmer-common";

type TypeRequestBody = {
    text: string;
};


@Controller("api")
export class Api {

    @RequestMapping("/guid", "GET")
    guid() {
        return {
            uuid: StaticCommon.guid()
        };
    }
    @RequestMapping("/encode", "POST")
    encode(@RequestBody body: TypeRequestBody) {
        console.log(body, "----");
        return utils.aseEncode(body.text);
    }

}