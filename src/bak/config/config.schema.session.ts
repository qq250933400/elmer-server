import { IConfigSession } from "./IConfigSession";
import { ISchemaConfig } from "../core/Schema";
import { IFormatCallbacks } from "./config.callbacks";

export default ({
    properties: {
        encode: {
            type: "Boolean",
            defaultValue: true
        },
        savePath: {
            type: "String",
            defaultValue: "./temp/sessions",
            format: "formatPath"
        },
        publicKey: {
            type: "String",
            maxLength: 16
        },
        timeout: {
            type: "Number",
            defaultValue: 7200000
        },
        enabled: {
            type: "Boolean",
            defaultValue: false
        }
    }
}) as ISchemaConfig<IConfigSession, {}, IFormatCallbacks>;