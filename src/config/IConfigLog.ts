export interface IConfigLog {
    level: "debug" | "info" | "error";
    type: "file" | "multiFile" | "stdout";
    timeout?: number;
    extension?: string;
    category?: string;
}