export default {
    properties: {
        Server: {
            type: '#Server',
            isRequired: true
        },
        DB: {
            type: '#DB',
            isRequired: false
        },
        Log: {
            type: "#Log",
            isRequired: true
        },
        Email: {
            type: "#Email"
        }
    }
};
