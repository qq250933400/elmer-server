export default {
    properties: {
        port: {
            type: 'Number',
            default: 80
        },
        host: {
            type: 'String',
            default: '0.0.0.0'
        },
        publicKey: {
            type: "String",
            length: 16
        },
        staticPath: {
            type: "String"
        }
    }
}
