import ConfigSchema from "./Schema";
import { Schema } from "../Validation/Schema";

export class ConfigTemplate {
    constructor(private schema: Schema){}
    init() {
        const configData: any = {};
        Object.keys(ConfigSchema).forEach((key: string) => {
            const configSchema = ConfigSchema[key];
            configData[key] = this.schema.generateSchemaInitData(configSchema.data , configSchema.formatCallback);
        });
        console.log(configData);
    }
}
