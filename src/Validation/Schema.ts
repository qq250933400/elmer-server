import { AppService } from "../Annotation/module";
import { ISchemaConfig, ISchemaAttribute, ISchemaValidateType } from "./ISchemaValidation";
import utils from "../utils/utils";

interface IValidateAttrbuteConfig {
    schema: ISchemaAttribute<any, keyof ISchemaValidateType>;
    format?: Record<string, Function>;
    attrKey: string;
    attrValue?: any;
    attrKeyPath: string[];
    negative: { key: string, message: string, code?: string }[];
}

@AppService
export class Schema {
    validate<Data={}, OptionalFields={}, FormatCallback extends Record<string, Function> = {}>(data: Partial<Data>, schema: ISchemaConfig<Data, FormatCallback, OptionalFields>, formatCallback?: FormatCallback) {
        const negative: any[] = [];
        let positive = true;
        Object.keys(schema).forEach((attrKey: string) => {
            const attrValue = data[attrKey];
            const attrSchema = schema[attrKey];
            const attrKeyPath = [];
            
            if(!this.validateAttribute({
                schema: attrSchema,
                format: formatCallback as any,
                attrValue,
                attrKey,
                attrKeyPath,
                negative
            })) {
                positive = false;
            }
        });
        return {
            positive,
            negative
        };
    }
    private validateAttribute(config: IValidateAttrbuteConfig) {
        const { schema, format, attrValue, attrKey, negative, attrKeyPath } = config;
        const currentKey: string = [...attrKeyPath, attrKey].join(".");
        if(schema.required && utils.isEmpty(attrValue)) {
            negative.push({
                key: currentKey,
                message: `${currentKey}属性不能为空。`,
                code: "required"
            });
            return false;
        }
        switch(schema.type) {
            case "String": {
                const vdResult = this.validateString(attrValue, schema as any);
                if(vdResult) {
                    negative.push({
                        key: currentKey,
                        message: vdResult.message,
                        code: vdResult.code
                    });
                    return false;
                }
                break;
            }
            case "Number": {
                const vdResult = this.validateNumber(attrValue, schema as any);
                if(vdResult) {
                    negative.push({
                        key: currentKey,
                        message: vdResult.message,
                        code: vdResult.code
                    });
                    return false;
                }
                break;
            }
            case "Boolean": {
                if(!utils.isBoolean(attrValue)) {
                    negative.push({
                        key: currentKey,
                        message: `${attrValue} is not a boolean`,
                        code: 'type'
                    });
                    return false;
                }
                break;
            }
            case "RegExp": {
                if(!utils.isRegExp(attrValue)) {
                    negative.push({
                        key: currentKey,
                        message: `${attrValue} is not a RegExp`,
                        code: 'type'
                    });
                    return false;
                }
                break;
            }
            case "Date": {
                if(!(attrValue instanceof Date)) {
                    negative.push({
                        key: currentKey,
                        message: `${attrValue} is not a Date`,
                        code: 'type'
                    });
                    return false;
                }
                break;
            }
            case "Object": {
                let attrValidatePositive = true;
                const vdResult = this.validateObject(attrValue, schema as any, (subSchema: any) => {
                    Object.keys(subSchema).forEach((subAttrKey: string) => {
                        const subAttr = attrValue[subAttrKey];
                        const subAttrSchema = subSchema[subAttrKey];
                        const subAttrPath = [...attrKeyPath, attrKey];
                        if(!this.validateAttribute({
                            attrKey: subAttrKey,
                            attrKeyPath: subAttrPath,
                            attrValue: subAttr,
                            format,
                            negative,
                            schema: subAttrSchema
                        })) {
                            attrValidatePositive = false;
                        }
                    });
                });
                if(vdResult) {
                    negative.push({
                        key: currentKey,
                        message: vdResult.message,
                        code: vdResult.code
                    });
                    return false;
                }
                return attrValidatePositive;
            }
            case "Function": {
                if(typeof attrValue !== "function") {
                    negative.push({
                        key: currentKey,
                        message: `${attrValue} is not a Function`,
                        code: 'type'
                    });
                    return false;
                }
                break;
            }
            case "Array": {
                const vdResult = this.validateArray(attrValue, schema as any);
                if(vdResult) {
                    negative.push({
                        key: currentKey,
                        message: vdResult.message,
                        code: vdResult.code
                    });
                    return false;
                }
                break;
            }
            case "Ref": {
                break;
            }
        }
        return true;
    }
    private validateObject(attrValue: any, schema: ISchemaAttribute<any, "Object">, validateSubObj: Function) {
        if(utils.isObject(attrValue)) {
            if(schema.properties) {
                validateSubObj(schema.properties);
            }
        } else if(!utils.isEmpty(attrValue)) {
            return {
                message: `${attrValue} is not a Object`,
                code: "type"
            };
        }
    }
    private validateArray(attrValue: any, schema: ISchemaAttribute<any, "Array">) {
        if(utils.isArray(attrValue)) {

        } else if(!utils.isEmpty(attrValue)) {
            return {
                message: `${attrValue} is not a array`,
                code: "type"
            };
        }
    }
    private validateNumber(attrValue: any, schema: ISchemaAttribute<any, "Number">) {
        if(utils.isNumber(attrValue)) {
            const checkValue = attrValue.toString().indexOf(".") >= 0 ? parseFloat(attrValue.toString()) : parseInt(attrValue.toString());
            if(schema.min > 0 && schema.max > 0) {
                if(!(checkValue >= schema.min && checkValue <= schema.max)) {
                    return {
                        message: `${attrValue} should be between ${schema.min} and ${schema.max}.`,
                        code: 'RangeError'
                    };
                }
            } else if(schema.min > 0 && !schema.max) {
                if(checkValue < schema.min) {
                    return {
                        message: `${attrValue} should be greater than ${schema.min}.`,
                        code: 'RangeError'
                    };
                }
            } else if(schema.max > 0 && !schema.min) {
                if(checkValue > schema.max) {
                    return {
                        message: `${attrValue} should be less than ${schema.max}.`,
                        code: 'RangeError'
                    };
                }
            }
        } else if(!utils.isEmpty(attrValue)) {
            return {
                message: `${attrValue} is not a number`,
                code: "type"
            };
        }
    }
    private validateString(attrValue: any, schema: ISchemaAttribute<any, "String">) {
        if(utils.isString(attrValue)) {
            if(schema.length > 0) {
                if(attrValue.length !== schema.length) {
                    return {
                        message: `the value's length should be ${schema.length}`,
                        code: "length"
                    };
                }
            } else {
                if(schema.minLength > 0 && schema.maxLength > 0) {
                    if(!(attrValue.length >= schema.minLength && attrValue.length <= schema.maxLength)) {
                        return {
                            message: `the value's length should be between ${schema.minLength} and ${schema.maxLength}.`,
                            code: "length"
                        };
                    }
                } else if(schema.minLength > 0 && !schema.maxLength) {
                    if(attrValue.length < schema.minLength) {
                        return {
                            message: `the value's length should be greater than ${schema.minLength}.`,
                            code: "length"
                        };
                    }
                } else if(schema.maxLength > 0 && !schema.minLength) {
                    if(attrValue.length > schema.maxLength) {
                        return {
                            message: `the value's length should be less than ${schema.maxLength}.`,
                            code: "length"
                        };
                    }
                }
            }
        } else if(!utils.isEmpty(attrValue)) {
            return {
                message: "Invalid type",
                code: "type"
            };
        }
    }
}
