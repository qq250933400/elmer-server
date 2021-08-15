const formatNumber = (num: number, len: number): string => {
    const numStr = num.toString();
    const missLen = len > numStr.length ? len - numStr.length: 0;
    if(missLen > 0) {
        return "0".repeat(missLen) + numStr;
    } else {
        return numStr;
    }
}
if(typeof Date.prototype.format !== "function") {
    Date.prototype.format = function(format: string): string {
        const formatStr = format || "";
        const curDate = this;
        return formatStr.replace("YYYY", curDate.getFullYear())
            .replace("MM", formatNumber(curDate.getMonth() + 1,2))
            .replace("DD", formatNumber(curDate.getDate(),2))
            .replace("HH", formatNumber(curDate.getHours(),2))
            .replace("mm", formatNumber(curDate.getMinutes(),2))
            .replace("ss", formatNumber(curDate.getSeconds(),2));
    }
}
