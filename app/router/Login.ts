import { Controller, RequestMapping, DataModel, Model, DBModel, Autowired } from "../../src";


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

    @RequestMapping("/config", "GET", true)
    async config():Promise<any> {
        return this.ajaxData();
    }
    ajaxData(): Promise<any> {
        return this.loginModel.securityQuery((obj) => {
            return new Promise<any>((_resolve) => {
                this.loginModel.getNews();
                _resolve(obj.query("select * from msj_menus"));
            });
        });
    }
}
