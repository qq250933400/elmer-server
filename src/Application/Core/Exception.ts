export class Exception extends Error {
    constructor(public code: number, public message: string, public statusCode?: string|number, public data?: any) {
        super(message);
    }
}