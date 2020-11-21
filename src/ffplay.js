"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ffplay = void 0;
var stream_1 = require("stream");
var child_process_1 = require("child_process");
exports.ffplay = function (ctx) {
    var _a = child_process_1.spawn("ffplay", ("-i pipe:0 -ac " + ctx.nChannels + " -ar " + ctx.sampleRate + " -f " + (ctx.bitDepth == 16 ? "s16le" : "f32le")).split(" ")), stdin = _a.stdin, stdout = _a.stdout, stderr = _a.stderr;
    stderr.pipe(process.stderr);
    var pt = new stream_1.PassThrough();
    pt.pipe(stdin);
    return pt;
};
