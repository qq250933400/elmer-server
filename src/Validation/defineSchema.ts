import { ISchemaConfig } from "./ISchemaValidation";

export const defineSchema = <OptionalFields={}, FormatCallback={}, SchemaData={}>(
    config: ISchemaConfig<SchemaData, FormatCallback, OptionalFields>,
    callbacks?: FormatCallback
) => {
    return {
        data: config,
        format: callbacks
    };
};
export const defineFormat = <T={}>(config: { [ P in keyof T ]: (value: any, data: any) => any }):T =>  {
    return {} as T;
}

