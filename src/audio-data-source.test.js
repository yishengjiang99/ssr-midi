"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var fs_1 = require("fs");
var audio_data_source_1 = require("./audio-data-source");
var ssrctx_1 = require("./ssrctx");
var sampleDir = function (filename) { return require("path").resolve(__dirname, "../testdata", filename); };
describe("fileSource", function () {
    it("reads from a file", function (done) {
        var ctx = new ssrctx_1.SSRContext({ nChannels: 1 });
        var file = new audio_data_source_1.FileSource(ctx, {
            filePath: sampleDir("440.pcm"),
        });
        var d = file.pullFrame();
        chai_1.expect(d).to.exist;
        chai_1.expect(d.byteLength).to.equal(ctx.blockSize);
        var readFile = fs_1.readFileSync(sampleDir("440.pcm"));
        var buff = readFile.slice(0, ctx.blockSize);
        chai_1.expect(buff).deep.equal(d);
        ctx.stop();
        done();
        //	expect(buffer.byteLength).to.equal(ctx.blockSize);
    });
});
describe("playaudio", function () {
    it("ssr must generate correct audio at 16bit signal", function () {
        var ctx = new ssrctx_1.SSRContext({
            bitDepth: 16,
            sampleRate: 9000,
            nChannels: 1,
        });
        var osc = new audio_data_source_1.Oscillator(ctx, { frequency: 440 });
        osc.start();
        var buffer = osc.pullFrame();
        chai_1.expect(buffer.length).to.equal(ctx.blockSize);
        chai_1.expect(buffer.byteLength).to.equal(128 * 2);
        ctx.start();
        ctx.stop(0.5);
    });
});
describe("scheduled buffere source", function () {
    var ctx = new ssrctx_1.SSRContext();
    var fd = fs_1.openSync(sampleDir("440.pcm"), "r");
    var buffer = Buffer.allocUnsafe(ctx.blockSize * 350);
    fs_1.readSync(fd, buffer, 0, ctx.blockSize * 350, 0);
    fs_1.closeSync(fd);
    it("should play about 1 second", function (done) {
        var node = new audio_data_source_1.BufferSource(ctx, {
            buffer: buffer,
            start: 0.12,
            end: 0.31,
        });
        chai_1.expect(ctx.inputs.length).to.equal(1);
        chai_1.expect(node.active).false;
        setTimeout(function () {
            chai_1.expect(node.active).true;
            setTimeout(function () {
                chai_1.expect(node.active).false;
                done();
            }, 330);
        }, 123);
        ctx.start();
    });
    afterEach(function () {
        ctx.stop(0);
    });
});
