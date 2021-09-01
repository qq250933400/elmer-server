import { ADataBase } from "./ADataBase";

type TypeDataEngineEvent = "onError" | "onConnected" | "onQuery";

export abstract class ADataEngine extends ADataBase {
    connection: any;
    public isConnected: boolean;
    public connectedDateTime: string;
    private eventListener: any = {};
    // abstract createConnection<T={}>(): T;
    abstract connect(): Promise<any>;
    abstract dispose(): void;
    abstract query<T={}, P = {}>(connect: any, queryString: P): Promise<T>;
    abstract readDataSource<T={}>(...args: any[]): T;
    abstract parameterization<T={}>(queryStr: any, params: any, id: string): T;
    on(eventName: TypeDataEngineEvent, callback: Function): void {
        this.eventListener[eventName] = callback;
    }
    fire(eventName: TypeDataEngineEvent, ...args: any[]): boolean {
        if(typeof this.eventListener[eventName] === "function") {
            this.eventListener[eventName](...args);
            return true;
        } else {
            return false;
        }
    }
}
