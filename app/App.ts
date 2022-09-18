import "reflect-metadata";
import "./router";
import { BootApplication, Config } from "../src";

@Config("./app/config.yml")
@Config("./app/corssSite.json", "Security")
@BootApplication
export class App {

}
