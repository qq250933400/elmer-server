export default {
    properties: {
        level: {
            type: ["debug", "info", "error"],
            default: "info"
        },
        savePath: {
            type: "String",
            default: "./temp/logs"
        }
    }
};
