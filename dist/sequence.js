"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const audio_data_source_1 = require("./audio-data-source");
const ssrctx_1 = require("./ssrctx");
const ctx = ssrctx_1.SSRContext.fromFileName("-ac1");
const osc = new audio_data_source_1.Oscillator(ctx, { frequency: 220 });
osc.connect(ctx);
const readable = new stream_1.Readable({
    read() {
        ctx.on("data", (d) => {
            return d;
        });
        ctx.pump();
    },
});
console.log(readable.read());
console.log(readable.read());
console.log(readable.read());
console.log(readable.read());
ctx.stop();
// const socket = net.createConnection("/tmp/1", () => {
// 	socket.write("");
// });
//# sourceMappingURL=sequence.js.map