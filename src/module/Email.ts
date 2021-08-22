import { Service, utils } from "elmer-common";
import { Logger } from "log4js";
import { createTransport, Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { GetConfig, IConfigEmail } from "../config";
import { GetLogger } from "../logs";

type TypeSendEmailOption = {
    toUsers: string[];
    ccUsers?: string[];
    subject?: string;
    text?: string;
    html?: string;
};

@Service
export class Email {
    @GetConfig(null, "Email")
    private config: IConfigEmail;

    @GetLogger()
    private logger: Logger;

    constructor() {
        console.log(this.config);
    }
    send(option: TypeSendEmailOption):Promise<any> {
        const mailOption: any = {
            from: this.config.user,
            to: option.toUsers.join(",")
        };
        if(!utils.isEmpty(option.text)) {
            mailOption.text = option.text;
        }
        if(!utils.isEmpty(option.html)) {
            mailOption.html = option.html;
        }
        return new Promise((resolve,reject) => {
            const reporter = this.createTransport();
            reporter.sendMail(mailOption, (err) => {
                if(err) {
                    this.logger.error(err.stack);
                    reject({
                        statusCode: "EMAIL_500",
                        message: err.message
                    });
                } else {
                    this.logger.info(`Email send success: ${mailOption.to}.`)
                    resolve({
                        statusCode: 200,
                        message: "发送成功"
                    });
                }
            });
        });
    }
    private createTransport(): Transporter<SMTPTransport.SentMessageInfo> {
        console.log({
            host: this.config.smtp,
            secure: false,
            auth: {
                user: this.config.user,
                pass: this.config.accessKey
            }
        });
        return createTransport({
            host: this.config.smtp,
            secure: false,
            auth: {
                user: this.config.user,
                pass: this.config.accessKey
            }
        });
    }
}