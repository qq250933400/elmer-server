import { Service, Param } from "../src";

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
    run(@Param linkApp: TestApp, @Param version: String) {
        // this.testApp.test();
        console.log("run TestService");
    }
}
