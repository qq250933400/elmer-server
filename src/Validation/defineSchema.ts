import { ISchemaAttribute, ISchemaValidateType } from "./ISchemaValidation";

type ISchemaConfig<T, FormatCallback, OptionalFields> = {
    [P in keyof T]: ISchemaAttribute<FormatCallback, keyof ISchemaValidateType> & {
        properties?: ISchemaConfig<T[P], FormatCallback, OptionalFields>
    } & Partial<OptionalFields>;
};

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
