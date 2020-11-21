"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RTServer = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var grep_wss_1 = require("grep-wss");
var path_1 = require("path");
var midi_buffer_source_1 = require("./midi-buffer-source");
var audio_data_source_1 = require("./audio-data-source");
var soundkeys_1 = require("./soundkeys");
var ssrctx_1 = require("./ssrctx");
var midfiles = path_1.resolve(__dirname, "../csv");
var files = child_process_1.execSync("ls " + midfiles).toString().split("\n");
// const csvs = readdirSync(midfiles).map((file) => loadMidi(file, file + ".csv"));
exports.RTServer = function (config) {
    return new Promise(function (resolve) {
        var map = [];
        var ctx = ssrctx_1.SSRContext.fromFileName("-ac1-ar9000-s16le");
        var server = new grep_wss_1.WsServer(config);
        server.on("connection", function (ws, req) {
            ctx.on("data", function (d) { return ws.write(d); });
            ws.socket.on("data", function (data) { return onData(ws, data); });
            ws.write(child_process_1.execSync("ls " + midfiles).toString());
        });
        server.on("listening", function () { return resolve(server); });
        server.start();
        var onData = function (ws, data) {
            var request = data.toString().trim();
            if (fs_1.existsSync(midfiles + "/" + request)) {
                midi_buffer_source_1.playCSVmidi(ctx, midfiles + "/" + request, "");
            }
            if (request.length == 1 && soundkeys_1.keyboardToFreq(request, 3) >= 0) {
                var osc = new audio_data_source_1.Oscillator(ctx, {
                    frequency: soundkeys_1.keyboardToFreq(request, 3),
                });
                osc.connect(ctx);
                osc.start();
            }
        };
    });
};
exports.RTServer({ port: 5150 });
