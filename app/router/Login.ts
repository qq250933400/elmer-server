import { Controller, RequestMapping, DataModel,QueryParam,RequestCookie } from "../../src";
import { Autowired } from "elmer-common";
import { GetResponse, RequestHeader, StaticFiles } from "../../src/core";
import { Request, Response } from "express";

class LoginModel extends DataModel {
    dataSource() {
        return "sso.mysql";
    }
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
        return {};
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
