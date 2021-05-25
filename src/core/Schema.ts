import { Service } from "./ClassDecorator";
import utils from "../core/utils";

interface ISchemaValidate {
    (data: any): void;
    (data: any, schema: any): void;
    (data: any, schema: any, name: string): void;
    (data: any, name: string): void;
}

abstract class ASchema {
    abstract validate: ISchemaValidate;
}

@Service
export class Schema extends ASchema{
    private schemaConfig: any = {};
    validate:ISchemaValidate = (data: any, schema?: any, name?: string): void => {
        if(utils.isObject(schema)) {
            this.doValidate(data, schema, name || "Unknow", []);
        } else if(utils.isString(schema)) {
            this.doValidate(data, this.schemaConfig[schema as string] as any, schema as string, []);
        } else {
            const name = Object.keys(this.schemaConfig)[0];
            this.doValidate(data, this.schemaConfig[name], name, []);
        }
    }
    addSchema(name: string, schema: any): void {
        if(schema) {
            this.schemaConfig[name] = schema;
        }
    }
    private doValidate(data: any, schema: any, name?: string, prefixKey?: string[]): boolean {
        const properties = schema?.properties;
        if(properties) {
            for(const attrKey of Object.keys(properties)) {
                const config = properties[attrKey];
                const isRequired = config.isRequired;
                const type = config?.type;
                const keyPathArray = [...prefixKey, attrKey];
                const keyPath = [...prefixKey, attrKey].join(".");
                let importRules = false;
                if(isRequired && data && (undefined === data[attrKey] || null === data[attrKey])) {
                    data[attrKey] = config.default;
                    throw new Error(`配置${name}数据属性${keyPath}是必须设置参数不能为空。`);
                }
                if(data) {
                    if(/^#/.test(type)) {
                        const schemaName = type.replace(/^#/, "");
                        if(this.schemaConfig[schemaName]) {
                            importRules = true;
                            this.doValidate(data[attrKey], this.schemaConfig[schemaName], schemaName, keyPathArray);
                        } else {
                            throw new Error(`配置${name}参数属性${keyPath}引用规则(${schemaName})不存在`);
                        }
                    } else {
                        if(!this.checkType(data[attrKey], type, keyPath, name)) {
                            const typeDesc = utils.isRegExp(type) ? type.source : JSON.stringify(type);
                            throw new Error(`配置${name}数据属性${keyPath}数据类型不正确，定义类型：${typeDesc}`);
                        } else {
                            if(config.length > 0) {
                                if(data[attrKey]?.length !== config.length) {
                                    throw new Error(`配置${name}数据属性${keyPath}数据长度必须是${config.length}位。`);
                                }
                            } else if(config.maxLength > 0) {
                                if(data[attrKey]?.length > config.maxLength) {
                                    throw new Error(`配置${name}数据属性${keyPath}数据长度不能大于${config.maxLength}。`);
                                }
                            } else if(config.minLength > 0) {
                                if(data[attrKey]?.length < config.minLength) {
                                    throw new Error(`配置${name}数据属性${keyPath}数据长度必须大于${config.minLength}。`);
                                }
                            }
                        }
                    }
                    !importRules && this.doValidate(data[attrKey], config, name, keyPathArray);
                }
            }
        }
        return true;
    }
    private checkType(data: any, type:String|RegExp, keyPath: string, name: string) {
        if(utils.isRegExp(type)) {
            return type.test(data);
        } else if(utils.isArray(type)) {
            return type.indexOf(data) >= 0;
        } else if(utils.isString(type)) {
            switch(type) {
                case "String": {
                    return utils.isString(data);
                }
                case "Object": {
                    return utils.isObject(data);
                }
                case "Array": {
                    return utils.isArray(data);
                }
                case "RegExp": {
                    return utils.isRegExp(data);
                }
                case "Number": {
                    return utils.isNumber(data);
                }
                default: {
                    throw new Error(`配置${name}参数${keyPath}数据类型错误：${type}, [String, Object, Array, RegExp, Number]`);
                }
            }
        } else {
            throw new Error(`配置${name}参数${keyPath}数据类型错误：${type}, [String, Object, Array, RegExp, Number]`);
        }
    }
};

