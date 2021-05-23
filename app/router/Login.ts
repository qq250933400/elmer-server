import { Controller, RequestMapping, ARouter } from "../../src";
import { Express } from "express";

@Controller("login")
export class Login extends ARouter {
    app:Express;

    @RequestMapping("/config", "GET", true)
    async config():Promise<any> {
        return this.ajaxData();
    }
    ajaxData(): Promise<any> {
        return new Promise<any>((resolve) => {
            setTimeout(() => {
                console.log("timeout");
                resolve({status: 400})
            }, 3000);
        });
    }
}
