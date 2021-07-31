import { Service } from "elmer-common";

@Service
class TestApp {
    test() {
        console.log("test App");
    }
}

@Service
export class TestService {
    constructor(private testApp: TestApp) {
        console.log("Industry: ",testApp);
        console.log(testApp.test());
        console.log(this.testApp.test())
    }
    run() {
        // this.testApp.test();
        console.log("run TestService");
    }
}
