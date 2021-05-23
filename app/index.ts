import * as express from "express";
import { Login } from "./router/Login";
import { App } from "./App";

const app = express();
const port = 8000;

// app.listen(port);

(new App()).main();

export default {};
