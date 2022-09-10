import utils from "../utils/utils";
import { ABasePlugin, TypePluginCallbackOption, TypePluginType } from "./ABasePlugin";
import { GetConfig } from "../config";
import { IConfigDB } from "../config/IConfigDB";

export class MysqlPlugin extends ABasePlugin {
    @GetConfig("DB")
    private config: IConfigDB;

    init(): void {
        this.register("DataModelPlugin", {
            "parameterization": this.parameterization.bind(this),
            "parameterValidate": this.parameterValidate.bind(this)
        });
    }
    getId(): string {
        return "Mysql_eab2c89c-4168-378f-86c2-a08bc03c";
    }
    getType(): TypePluginType {
        return "Model";
    }
    parameterValidate(options: TypePluginCallbackOption, keyValue: any, id: string,): any {
        const checkData = options.returnValue || keyValue || "";
        if(utils.isNumeric(checkData)) {
            return checkData;
        } else {
            let checkValue:string = checkData.toString();
            checkValue = checkValue.replace(/'/g, "\\'").replace(/\/\//g, "");
            return checkValue;
        }
    }
    parameterization(options: TypePluginCallbackOption, queryValue: string|object, params: any, id: string, fn: Function): any {
        let queryStr = options.returnValue || queryValue.toString();
        const varArrs = queryStr.match(/\$\{\s*([a-z0-9_\.]{1,})\s*\}/ig);
        const varResult = {
            values: [],
            queryString: queryStr
        };
        varArrs?.length > 0 && varArrs.map((varStr) => {
            const varM = varStr.match(/\$\{\s*([a-z0-9_\.]{1,})\s*\}/i);
            const dataKey = varM[1];
            let dataValue = utils.getValue(params, dataKey);
            if(!utils.isEmpty(dataValue)) {
                if(typeof fn === "function") {
                    const securityValue = fn(dataValue, dataKey);
                    if(securityValue) {
                        dataValue = securityValue;
                    }
                }
            } else {
                throw new Error(`指定查询参数值不能为null或者undefined.(参数：${dataKey}, 查询过程：${id})`);
            }
            queryStr = queryStr.replace(varM[0], "?");
            varResult.values.push(dataValue);
        });
        // ----- replace table prefix
        const prefixMatch = queryStr.match(/\s__[a-z0-9_]{1,}__\s/ig);
        if(prefixMatch && !utils.isEmpty(this.config?.prefix)) {
            prefixMatch.map((prefixV) => {
                const tableName = prefixV.replace(/\s__([a-z0-9_]{1,})__\s/i, `${this.config.prefix}$1`);
                while(queryStr.indexOf(prefixV)>=0) {
                    queryStr = queryStr.replace(prefixV, ` ${tableName} `);
                }
            });
        }
        options.returnValue = queryStr;
        varResult.queryString = queryStr.replace(/^[\r\n\s]*/,"").replace(/[\r\n\s]*$/, "");
        return varResult;
    }

}