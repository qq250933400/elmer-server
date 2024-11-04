import { defineSchema } from "../../Validation/defineSchema";
import { IConfigValidationOptionalFields } from "../interface/IConfigValidationOptionalFields";
import { IConfigDB } from "../interface/IConfigDB";

export default defineSchema<IConfigValidationOptionalFields, {},IConfigDB>({
    "type": {
        type: "String",
        defaultValue: "Mysql",
        // enum: ["Mysql", "MongoDB", "Redis"]
    },
    "database": {
        type: "String",
        defaultValue: "test",
        required: true
    },
    "host": {
        type: "String",
        defaultValue: "0.0.0.0",
        required: true
    },
    "user": {
        type: "String",
        defaultValue: "root",
        required: true
    },
    "password": {
        type: "String",
        defaultValue: "",
        required: true
    },
    "port": {
        type: "Number",
        defaultValue: 3306,
        required: true
    },
    "tablePrefix": {
        type: "String",
        defaultValue: ""
    },
    "sourcePath": {
        type: "String",
        defaultValue:"./src/Application/DataBase/Mysql/schema",
    }
});
