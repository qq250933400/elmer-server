import { Controller, RequestMapping, DataModel,QueryParam, Model, DBModel, Autowired } from "../../src";
import { StaticFiles } from "../../src/core";

@DBModel("sso")
class LoginModel extends DataModel {
    getNews() {
        return this.alias("b")
            .where(["status=1"])
            .field(["status", "name", "context"])
            .limit(0,10)
            .find();
    }
}

@Controller("login")
export class Login {

    @Autowired(LoginModel)
    loginModel: LoginModel;
    @Autowired(StaticFiles)
    files: StaticFiles;

    @RequestMapping("/config", "GET", true)
    async config():Promise<any> {
        return this.ajaxData();
    }
    ajaxData(): Promise<any> {
        return this.loginModel.securityQuery((obj) => {
            return obj.query("select * from msj_menus");
        });
    }
    @RequestMapping("/test", "GET")
    test(@QueryParam("test") str: any) {
        console.log(str);
        return this.files.readJson("./test.json");
    }
}
