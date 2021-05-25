import { Controller, RequestMapping, DataModel, Model, Autowired } from "../../src";


@Model
class LoginModel extends DataModel {

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
                _resolve(obj.query("select * from msj_menus"));
            });
        });
    }
}
