interface IExceptinData<T={}> {
    status?: number;
    data?: T;
}

export class Exception<Data={}> extends Error {
    private _data: IExceptinData<Data>;
    constructor(message: string, data: IExceptinData<Data>) {
        super(message);
        this._data = data;
    }
    get data(): IExceptinData<Data> {
        return this._data;
    }
    set data(data: IExceptinData<Data>) {
        this._data = data;
    }
}
