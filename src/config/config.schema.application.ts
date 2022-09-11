export default {
    properties: {
        Server: {
            type: '#Server',
            isRequired: true
        },
        DataBase: {
            type: '#DataBase',
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
