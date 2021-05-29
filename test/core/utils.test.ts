import { utils } from "../../src";

const encodeText = "中文 Hello world";
describe("utils模块测试", () => {
    test("aes加密测试", () => {
        const encodeValue = utils.aseEncode(encodeText);
        const decodeValue = utils.aseDecode(encodeValue);
        expect(decodeValue).toBe("中文 Hello world");
        expect(encodeValue).toBe("fc908b8915d21ea766de4c3219ac2dc993dcfe1dc908aac23ea3c1bfb5862de0");
    });
    test("随机文本生成", () => {
        const txt = utils.getRandomText(16);
        console.log(txt);
        expect(txt.length).toBe(16);
    });
})