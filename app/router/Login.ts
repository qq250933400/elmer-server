import { Controller, RequestMapping } from "../../src";
import { Express } from "express";

@Controller("login")
export class Login {
    app:Express;

    @RequestMapping("/config", "GET", true)
    async config():Promise<any> {
        return this.ajaxData();
    }
    ajaxData(): Promise<any> {
        return new Promise<any>((resolve: Function) => {
            setTimeout(() => {
                resolve({status: 400})
            }, 3000);
        });
    }
}
