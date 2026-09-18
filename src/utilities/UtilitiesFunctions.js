"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilitiesFunctions = void 0;
class UtilitiesFunctions {
    static generateHexString(length) {
        let ret = "";
        while (ret.length < length) {
            ret += Math.random().toString(16).substring(2);
        }
        const datePart = new Date().getTime().toString(36);
        return `${ret.substring(0, length)}-${datePart}`;
    }
    static capitalizeFirst(text) {
        text = text.trim();
        return `${(text[0] || '').toUpperCase()}${text.slice(1).toLowerCase()}`;
    }
}
exports.UtilitiesFunctions = UtilitiesFunctions;
//# sourceMappingURL=UtilitiesFunctions.js.map