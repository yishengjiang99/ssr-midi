"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode16 = exports.decode32 = exports.Decoder = exports.Encoder = void 0;
const ieee754_1 = require("@xtuc/ieee754");
class Encoder {
  constructor(bitDepth) {
    this.bitDepth = bitDepth;
  }
  encode(buffer, value, index) {
    let f = value;
    const dv = new DataView(buffer.buffer);
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
  }
}
exports.Encoder = Encoder;
class Decoder {
  constructor(bitDepth) {
    this.bitDepth = bitDepth;
  }
  decode(buffer, index) {
    const dv = new DataView(buffer.buffer);
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
  }
}
exports.Decoder = Decoder;
exports.decode32 = new Decoder(32);
exports.decode16 = new Decoder(16);
//# sourceMappingURL=Kodak.js.map
