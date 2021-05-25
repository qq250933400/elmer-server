export default {
    properties: {
        port: {
            type: 'Number',
            default: 3060
        },
        type: {
            type: ['Mysql', 'Mogodb', 'Redis'],
            default: 'Mysql',
            isRequired: true
        },
        host: {
            type: "String",
            default: "localhost",
            isRequired: true
        },
        prefix: {
            type: "String"
        },
        user: {
            type: "String",
            isRequired: true
        },
        password: {
            type: "String"
        }
    }
}
