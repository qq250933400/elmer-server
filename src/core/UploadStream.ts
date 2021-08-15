import { Writable } from "stream";


export class UploadStream extends Writable {
    parseHeaders(headers) {
        console.log(headers);
    }
    _write() {
        console.log(arguments);
    }
}
