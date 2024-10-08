export declare interface ISchemaValidateTypeData {
    value: any;
}
export declare interface ISchemaValidateType {
    String: {
        value: string;
        length?: number;
        minLength?: number;
        maxLength?: number;
    };
    Number: {
        value: number;
        min?: number;
        max?: number;
    };
    Boolean: {
        value: boolean;
    };
    Object: {
        value: Object;
        properties: ISchemaConfig<any, any, any>;
    };
    Array: {
        value: Array<any>;
        itemType: ISchemaValidateType;
    };
    Date: {
        value: Date;
    };
    RegExp: {
        value: RegExp;
    };
    Function: {
        value: Function;
    };
    Ref: {
        value: String;
        refType: String;
    }
}


// type B = AB.name;

export declare type ISchemaAttribute<IFormatCallback,DataType extends keyof ISchemaValidateType> = {
    type: DataType;
    required?: boolean;
    format?: keyof IFormatCallback;
    defaultValue?: any;
} & Omit<ISchemaValidateType[DataType], "value">;


export type ISchemaConfig<T, FormatCallback, OptionalFields> = {
    [P in keyof T]?: ISchemaAttribute<FormatCallback, keyof ISchemaValidateType> & {
        properties?: ISchemaConfig<T[P], FormatCallback, OptionalFields>
    } & Partial<OptionalFields>;
};

export declare interface ISchemaValidateResult {
    positive: boolean;
    message?: string;
    negative?: {key: string, message: string}[];
}