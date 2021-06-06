import { Controller, RequestMapping, DataModel,QueryParam, Model, BindModelSource, Autowired } from "../../src";
import { StaticFiles } from "../../src/core";

@BindModelSource("sso.mysql")
class LoginModel extends DataModel {
    getNews() {
        
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
            return obj.query("loginConfig", {
                name: "test"
            })
        });
    }
    @RequestMapping("/test", "GET")
    test(@QueryParam("test") str: any) {
        console.log(str);
        return this.files.readJson("./test.json");
    }
}
