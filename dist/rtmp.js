"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RTServer = void 0;
const grep_wss_1 = require("grep-wss");
const audio_data_source_1 = require("./audio-data-source");
const soundkeys_1 = require("./soundkeys");
const ssrctx_1 = require("./ssrctx");
exports.RTServer = (config) => {
    return new Promise((resolve) => {
        const map = [];
        const ctx = ssrctx_1.SSRContext.fromFileName("-ac1-ar9000-f32le");
        const server = new grep_wss_1.WsServer(config);
        server.on("connection", (ws, req) => {
            ws.socket.on("data", (data) => onData(ws, data));
        });
        server.on("listening", () => resolve(server));
        server.start();
        const onData = (ws, data) => {
            const request = data.toString().trim();
            if (request.length == 1 && soundkeys_1.keyboardToFreq(request, 3) >= 0) {
                const osc = new audio_data_source_1.Oscillator(ctx, {
                    frequency: soundkeys_1.keyboardToFreq(request, 3),
                });
                osc.start();
            }
        };
    });
};
//# sourceMappingURL=rtmp.js.map