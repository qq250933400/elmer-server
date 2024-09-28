import {
    META_VALUE_BOOT_APPLICATION
} from "../../data/constants";
import { Adapter } from "../Core/Adapter";
import { defineModule, validateModuleEx } from "../../Annotation/module";
export const BootApplication = (Target: new(...args: any[]) => any) => {
    defineModule(Target, META_VALUE_BOOT_APPLICATION, {
        errmsg: "The boot application can not use with other class decorator"
    });
};

export const HttpAdapter = <T extends Adapter> (Adapter: T) => ( BootApplication: new(...args: any[]) => any) => {
    if(!validateModuleEx(BootApplication, META_VALUE_BOOT_APPLICATION)) {
        throw new Error("The HttpAdapter can only use with boot Application");
    }
    (BootApplication as any).adapter = Adapter;
    console.log("---defineAdaptuer---");
}
