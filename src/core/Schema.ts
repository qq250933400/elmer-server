import { Service } from "./ClassDecorator";

interface ISchemaValidate {
    (data: any): void;
    (data: any, schema: any): void;
    (data: any, name: string): void;
}

abstract class ASchema {
    abstract validate: ISchemaValidate;
}

@Service
export class Schema extends ASchema{
    private schemaConfig: any = {};
    validate:ISchemaValidate = (data: any, schema?: any): void => {
        console.log("validate: ",data, schema);
    }
    addSchema(name: string, schema: any): void {
        if(schema) {
            this.schemaConfig[name] = schema;
        }
    };
};

