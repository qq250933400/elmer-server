import { ADataBase } from "./ADataBase";

export abstract class ADataEngine extends ADataBase {
    connection: any;
    // abstract createConnection<T={}>(): T;
    abstract connect(): void;
    abstract dispose(): void;
    abstract createQuery<T={}, P={}>(data: P[]): T;
    abstract query<T={}>(queryString: string): Promise<T>;
}
