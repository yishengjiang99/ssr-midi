"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readHeader = exports.wavHeader = void 0;
var fs_1 = require("fs");
var ssrctx_1 = require("./ssrctx");
var writeString = function (view, offset, str) {
    return str.split("").map(function (char, idx) {
        view.setUint8(offset + idx, char.charCodeAt(0));
    });
};
/*
    `52 49 46 46 24 08 00 00 57 41 56 45 66 6d 74 20 10 00 00 00 01 00 02 00
22 56 00 00 88 58 01 00 04 00 10 00 64 61 74 61 00 08 00 00 00 00 00 00
24 17 1e f3 3c 13 3c 14 16 f9 18 f9 34 e7 23 a6 3c f2 24 f2 11 ce 1a 0d`;
*/
exports.wavHeader = function (length, sampleRate, numChannels, bitDepth) {
    if (sampleRate === void 0) { sampleRate = 44100; }
    if (numChannels === void 0) { numChannels = 2; }
    if (bitDepth === void 0) { bitDepth = 16; }
    var sampleRate = sampleRate;
    var numChannels = numChannels;
    var samples = length;
    var buffer = new ArrayBuffer(48);
    var view = new DataView(buffer);
    /* RIFF identifier */
    writeString(view, 0, "RIFF");
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, "WAVE");
    /* format chunk identifier */
    writeString(view, 12, "fmt ");
    /* format chunk length */
    view.setUint32(16, bitDepth, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, (sampleRate * bitDepth) / 8, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, (numChannels * bitDepth) / 8, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(view, 36, "data");
    // /* data chunk length */
    view.setUint32(40, (samples.length * bitDepth) / 8, true);
    return view.buffer;
};
exports.readHeader = function (path) {
    var fd = fs_1.openSync(path, "r");
    var ob = Buffer.alloc(48);
    fs_1.readSync(fd, ob, 0, 48, 0);
    var view = new DataView(ob.buffer);
    var _a = [
        view.getUint16(22, true),
        view.getUint32(24, true),
        view.getUint32(28, true),
        view.getUint32(32, true),
        view.getUint16(34, true),
    ], nChannels = _a[0], sampleRate = _a[1], _ = _a[2], __ = _a[3], bitDepth = _a[4];
    return new ssrctx_1.SSRContext({ nChannels: nChannels, sampleRate: sampleRate, bitDepth: bitDepth });
};