
export interface IConfigDB {
    port: number;
    host: string;
    type: "Mysql" | "MongoDB" | "Redis";
    prefix?: string;
    user: string;
    dataBase: string;
    password: string;
    sourcePath: string;
}