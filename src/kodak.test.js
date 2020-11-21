"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var audio_data_source_1 = require("./audio-data-source");
var ssrctx_1 = require("./ssrctx");
describe("codec", function () {
    it("decode s16", function () {
        var ctx = ssrctx_1.SSRContext.fromFileName("db/cache/s16le-ar9000-ac1-midi.csv.cache.pcm");
        chai_1.expect(ctx.bitDepth).eq(16);
        chai_1.expect(ctx.nChannels).eq(1);
        var file = new audio_data_source_1.FileSource(ctx, {
            filePath: "db/cache/s16le-ar9000-ac1-midi.csv.cache.pcm",
        });
        file.connect(ctx);
        var buff = file.pullFrame();
        console.log(buff);
    });
});
