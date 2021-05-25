
export interface IConfigDB {
    port: number;
    host: string;
    type: "Mysql" | "MongoDB" | "Redis";
    prefix?: string;
}