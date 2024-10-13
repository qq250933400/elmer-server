import { AppService } from "../Annotation/module";
import { GetConfig } from "../Config/GetConfig";
import { IConfigServer } from "../Config/interface/IConfigServer";
import utils from "../utils/utils";

@AppService
export class UtilsService {
    @GetConfig("Server")
    public readonly config!: IConfigServer;

    aseEncode(encodeText: string): string {
        return utils.aseEncode(encodeText.toString(), this.config.publicKey?.toString());
    }
    aseDecode(decodeText: string): string {
        return utils.aseDecode(decodeText.toString(), this.config.publicKey?.toString());
    }
}
