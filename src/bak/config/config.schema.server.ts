export default {
    properties: {
        port: {
            type: 'Number',
            defaultValue: 80
        },
        host: {
            type: 'String',
            defaultValue: '0.0.0.0'
        },
        publicKey: {
            type: "String",
            length: 16
        },
        staticPath: {
            type: "String",
            defaultValue: "./assets",
            format: "formatPath"
        },
        staticRoute: {
            type: "String"
        },
        uploadPath: {
            type: "String",
            defaultValue: "./assets/upload",
            format: "formatPath"
        },
        tempPath: {
            type: "String",
            defaultValue: "./temp",
            format: "formatPath"
        }
    }
}
