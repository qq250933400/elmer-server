import utils from "../core/utils";
import { ABasePlugin, TypePluginCallbackOption, TypePluginType } from "./ABasePlugin";

export class MysqlPlugin extends ABasePlugin {
    init(): void {
        this.register("MysqlPlugin", {
            "parameterization": this.parameterization.bind(this)
        });
    }
    getId(): string {
        return "eab2c89c-4168-378f-86c2-a08bc03c";
    }
    getType(): TypePluginType {
        return "Request";
    }
    parameterization(options: TypePluginCallbackOption, queryValue: string|object, params: any, fn: Function) {
        let queryStr = queryValue.toString();
        const varArrs = queryStr.match(/\$\{\s*([a-z0-9_\.]{1,})\s*\}/ig);
        varArrs?.length > 0 && varArrs.map((varStr) => {
            const varM = varStr.match(/\$\{\s*([a-z0-9_\.]{1,})\s*\}/i);
            const dataKey = varM[1];
            let dataValue = utils.getValue(params, dataKey);
            if(typeof fn === "function") {
                dataValue = fn(dataValue, dataKey);
            }
            queryStr = queryStr.replace(varM[0], dataValue as any);
        });
        console.log(varArrs);
    }
}