"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audio_data_source_1 = require("./audio-data-source");
const ssrctx_1 = require("./ssrctx");
const path_1 = require("path");
const chai_1 = require("chai");
const sampleDir = (filename) => path_1.resolve(__dirname, "../samples", filename);
describe("ssrctx", () => {
    it("sets framerate, bitdepths etc", () => {
        const ctx = new ssrctx_1.SSRContext({
            nChannels: 2,
            bitDepth: 16,
            sampleRate: 9000,
        });
        chai_1.expect(ctx.fps).to.equal(ctx.sampleRate / 128);
        chai_1.expect(ctx.samplesPerFrame).to.equal(128 * 2);
        chai_1.expect(ctx.blockSize).to.equal(ctx.samplesPerFrame * ctx.sampleArray.BYTES_PER_ELEMENT);
        chai_1.expect(ctx.currentTime).to.equal(0);
        ctx.pump();
        chai_1.expect(ctx.currentTime).to.equal(ctx.secondsPerFrame);
    });
    it("stops on time", (done) => {
        const ctx = new ssrctx_1.SSRContext({
            nChannels: 2,
            bitDepth: 16,
            sampleRate: 44100,
        });
        ctx.stop(0.1);
        ctx.start();
        setTimeout(() => {
            chai_1.expect(ctx.playing).false;
            done();
        }, 122);
        // ctx.on("end", () => {
        // 	console.log(timediff(process.hrtime(), tick));
        // 	done();
        // });
        // setTimeout(() => {
        // 	expect(ctx.playing).false;
        // 	done();
        // }, 900);
    }).timeout(9000);
    it("parse bitdepth from filename", () => {
        const ctx = ssrctx_1.SSRContext.fromFileName(sampleDir("song-f32le.pcm"));
        chai_1.expect(ctx.bitDepth).to.equal(32);
        chai_1.expect(ctx.sampleRate).to.equal(ssrctx_1.SSRContext.defaultProps.sampleRate);
    });
    it("writes sufficient amount of data for playback", (done) => {
        const ctx = new ssrctx_1.SSRContext({
            nChannels: 2,
            bitDepth: 32,
            sampleRate: 44100,
        });
        const fss = new audio_data_source_1.FileSource(ctx, {
            filePath: sampleDir("song-f32le.pcm"),
        });
        fss.connect(ctx);
        ctx.stop();
        done();
    });
});
// 		const osc = new Oscillator(ctx, { frequency: 440 });
// 		osc.connect(ctx);
// 		const writ = new MemoryWritable();
// 		ctx.connect(writ);
// 		ctx.start();
// 		setTimeout(() => {
// 			expect(writ.data.length).to.equal(9000 / 128);
// 			ctx.stop();
// 			done();
// 		}, 1000);
// 		// expect(ctx.blockSize).to.equal((2 * 4 * 9000) / 128);
// 	});
// 	it("writes signed int16", (done) => {
// 		const b = Buffer.allocUnsafe(32);
// 		b.writeInt16LE(255, 0);
// 		expect(b[0]).to.equal(1 * 0xff);
// 		done();
// 	});
// });
//# sourceMappingURL=ssrctx.test.js.map