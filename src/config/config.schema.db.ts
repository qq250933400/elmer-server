export default {
    properties: {
        port: {
            type: 'number',
            default: 3060
        },
        type: {
            type: ['mysql', 'mogodb', 'redis'],
            default: 'mysql'
        }
    }
}
