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
        uploadPath: {
            type: "String",
            defaultValue: "./assets/upload",
            format: "formatPath"
        },
        temp: {
            type: "String",
            defaultValue: "./temp",
            format: "formatPath"
        }
    }
}
