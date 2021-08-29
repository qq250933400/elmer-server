import { Controller, RequestMapping, DataModel,QueryParam,RequestCookie, BindModelSource } from "../../src";
import { Autowired } from "elmer-common";
import { GetResponse, RequestHeader, StaticFiles } from "../../src/core";
import { Request, Response } from "express";

@BindModelSource("sso.mysql")
class LoginModel extends DataModel {
    getNews() {
        
    }
}

@Controller("login")
export class Login {

    @Autowired()
    loginModel: LoginModel;
    @Autowired()
    files: StaticFiles;

    @RequestMapping("/config", "GET")
    async config(
        @QueryParam page: number,
        @RequestCookie token: string,
        @RequestHeader header: any
    ):Promise<any> {
        console.log(page);
        console.log(token);
        console.log(header);
        return this.ajaxData();
    }
    ajaxData(): Promise<any> {
        return this.loginModel.securityQuery((obj) => {
            return obj.query("loginConfig", {
                name: "test",
                status:  0
            });
        });
    }
    @RequestMapping("/test", "GET")
    test(@QueryParam str: any, @GetResponse res: Response) {
        console.log(str);
        res.cookie("token", "1230099", {
            maxAge: 10000
        });
        return this.files.readJson("./test.json");
    }
}
