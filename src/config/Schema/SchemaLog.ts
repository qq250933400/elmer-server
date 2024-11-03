import { defineSchema } from "../../Validation/defineSchema";
import { IConfigValidationOptionalFields } from "../interface/IConfigValidationOptionalFields";
import { IConfigLog } from "../interface/IConfigLog";

export default defineSchema<IConfigValidationOptionalFields, {},IConfigLog>({
    "category": {
        type: "String",
        required: true,
        defaultValue: "default"
    },
    "level": {
        type: "String",
        defaultValue: "info",
        //enum: ["debug", "info", "error"]
    },
    "savePath": {
        type: "String",
        defaultValue: "./temp/logs"
    },
    "timeout": {
        type: "Number",
        defaultValue: 1000
    },
    "type": {
        type: "String",
        defaultValue: "console"
    }
});
