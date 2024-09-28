import { IConfigApplication } from "../../Config/interface";
import { Observe } from "elmer-common/lib/";

interface IAdapterEvent {
    error: (err: any) => void;
    ready: (url: string) => void;
    close: () => void;
}

export abstract class Adapter {
    public readonly configuration: IConfigApplication;

    abstract listen(): void;

    private observe: Observe<IAdapterEvent> = new Observe();
    
    init(configuration: IConfigApplication) {
        (this as any).configuration = configuration;
    }
    use(fn: Function) {

    }
    on<EventName extends keyof IAdapterEvent>(event: EventName, fn: IAdapterEvent[EventName]) {
        this.observe.on(event, fn);
    }
    emit<EventName extends keyof IAdapterEvent>(event: EventName, ...args: any[]) {
        return this.observe.emit(event, ...args);
    }
}
