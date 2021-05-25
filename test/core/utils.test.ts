import { utils } from "../../src";

const encodeText = "中文 Hello world";
describe("utils模块测试", () => {
    test("aes加密测试", () => {
        const encodeValue = utils.aseEncode(encodeText);
        const decodeValue = utils.aseDecode(encodeValue);
        expect(decodeValue).toBe("中文 Hello world");
        expect(encodeValue).toBe("766bda3c9bab5e5e0637184c9e2a18a3fe52138d63ef5bef640cbd46609a5742");
    });
    test("随机文本生成", () => {
        const txt = utils.getRandomText(16);
        console.log(txt);
        expect(txt.length).toBe(16);
    });
})