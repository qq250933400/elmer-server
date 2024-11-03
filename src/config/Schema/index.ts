import ServerConfigSchema from "./SchemaServer";
import LogConfigSchema from "./SchemaLog";
import DBConfigSchema from "./SchemaDB";
import SchemaRedis from "./SchemaRedis";

export default {
    Server: ServerConfigSchema,
    Log: LogConfigSchema,
    DataBase: DBConfigSchema,
    Redis: SchemaRedis
};
