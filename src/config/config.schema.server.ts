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
            defaultValue: "./assets"
        },
        uploadPath: {
            type: "String",
            defaultValue: "./assets/upload"
        },
        temp: {
            type: "String",
            defaultValue: "./temp"
        }
    }
}
