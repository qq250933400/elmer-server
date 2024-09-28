export declare interface ISchemaValidateTypeData {
    value: any;
}
export declare interface ISchemaValidateType {
    String: {
        value: string;
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
    };
    Array: {
        value: Array<any>;
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


let a: ISchemaAttribute<{}, keyof ISchemaValidateType> = {
    type: "Number",
    
}