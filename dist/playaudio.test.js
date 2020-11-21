// import { expect } from "chai";
// import { Oscillator } from "./audio-data-source";
// import { SSRContext } from "./ssrctx";
// describe("playaudio", () => {
// 	it("server must generate correct audio at 16bit signal", () => {
// 		const ctx = new SSRContext({
// 			bitDepth: 16,
// 			sampleRate: 9000,
// 			nChannels: 1,
// 		});
// 		const osc = new Oscillator(ctx, { frequency: 440 });
// 		const buffer = osc.pullFrame();
// 		expect(buffer.length).to.equal(ctx.blockSize);
// 		expect(buffer.byteLength).to.equal(128 * 2);
// 	});
// });
//# sourceMappingURL=playaudio.test.js.map