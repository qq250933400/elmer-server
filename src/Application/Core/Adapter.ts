import { IConfigApplication } from "../../Config/interface";
import { Observe } from "elmer-common/lib/";
import { IDefineRequestParam } from "../Request/Annotation";

interface IAdapterEvent {
    error: (err: any) => void;
    ready: (url: string) => void;
    close: () => void;
}

export abstract class Adapter {
    public readonly configuration: IConfigApplication = {} as any;

    abstract listen(): void;
    abstract loadRouter(): void;
    abstract get(url: string, handler: Function): void;
    abstract post(url: string, handler: Function): void;
    abstract put(url: string, handler: Function): void;
    abstract options(url: string, handler: Function): void;
    abstract delete(url: string, handler: Function): void;
    abstract use(handler: Function): void;
    abstract getParam(opt: IDefineRequestParam[], ...args: any[]): any[];

    private observe: Observe<IAdapterEvent> = new Observe();
    
    init(configuration: IConfigApplication) {
        (this as any).configuration = configuration;
    }
     
    on<EventName extends keyof IAdapterEvent>(event: EventName, fn: IAdapterEvent[EventName]) {
        this.observe.on(event, fn);
    }
    emit<EventName extends keyof IAdapterEvent>(event: EventName, ...args: any[]) {
        return this.observe.emit(event, ...args);
    }
    
}
