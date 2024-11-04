
export interface IConfigDB {
    port: number;
    host: string;
    type: "Mysql" | "MongoDB" | "Redis";
    tablePrefix?: string;
    user: string;
    database: string;
    password: string;
    sourcePath: string;
}