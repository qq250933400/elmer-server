import { defineSchema } from "../../Validation/defineSchema";
import { IConfigValidationOptionalFields } from "../interface/IConfigValidationOptionalFields";
import { IConfigRedis } from "../interface/IConfigRedis";

export default defineSchema<IConfigValidationOptionalFields, {}, IConfigRedis>({
    "database": {
        type: "Number",
        defaultValue: 0,
        required: true
    },
    "host": {
        type: "String",
        defaultValue: "127.0.0.1",
        required: true
    },
    "password": {
        type: "String",
        defaultValue: ""
    },
    "port": {
        type: "Number",
        defaultValue: 6379,
        required: true
    }
});
