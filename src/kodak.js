"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Decoder = exports.Encoder = void 0;
var ieee754_1 = require("@xtuc/ieee754");
var Encoder = /** @class */ (function () {
    function Encoder(bitDepth) {
        this.bitDepth = bitDepth;
    }
    Encoder.prototype.encode = function (buffer, value, index) {
        var dv = new DataView(buffer.buffer);
        switch (this.bitDepth) {
            case 32:
                ieee754_1.write(buffer, value, index * 4, 23, 4);
                break;
            case 16:
                value = Math.min(Math.max(-1, value), 1);
                value < 0 ? dv.setInt16(index * 2, value * 0x8000, true) : dv.setInt16(index * 2, value * 0x7fff, true);
                break;
            case 8:
                buffer.writeUInt8(value, index * Uint8Array.BYTES_PER_ELEMENT);
                break;
            default:
                throw new Error("unsupported bitdepth");
        }
    };
    return Encoder;
}());
exports.Encoder = Encoder;
var Decoder = /** @class */ (function () {
    function Decoder(bitDepth) {
        this.bitDepth = bitDepth;
    }
    Decoder.prototype.decode = function (buffer, index) {
        var dv = new DataView(buffer.buffer);
        switch (this.bitDepth) {
            case 32:
                ieee754_1.read(buffer, index * 4, true, 23, 32);
                break;
            case 16:
                return dv.getInt16(index * 2, true);
            case 8:
                return dv.getUint8(index * 2);
            default:
                throw new Error("unsupported bitdepth");
        }
    };
    return Decoder;
}());
exports.Decoder = Decoder;
