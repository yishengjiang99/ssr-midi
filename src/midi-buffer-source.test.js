"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var fs_1 = require("fs");
var audio_data_source_1 = require("./audio-data-source");
var midi_buffer_source_1 = require("./midi-buffer-source");
var ssrctx_1 = require("./ssrctx");
var tickToTime = function (t) { return t / 1000; };
describe("midi-buffersource", function () {
    var ctx = new ssrctx_1.SSRContext({
        nChannels: 1,
        bitDepth: 16,
        sampleRate: 9000,
    });
    it("it loads buffer from file", function () { return __awaiter(void 0, void 0, void 0, function () {
        var cache, buffer, buffer2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cache = initCache(ctx);
                    return [4 /*yield*/, midi_buffer_source_1.loadBuffer(ctx, midi_buffer_source_1.parseMidiCSV("clarinet,67,0.28301699999999996,,256,116"), cache)];
                case 1:
                    buffer = _a.sent();
                    return [4 /*yield*/, midi_buffer_source_1.loadBuffer(ctx, midi_buffer_source_1.parseMidiCSV("clarinet,67,0.28301699999999996,,256,116"), cache)];
                case 2:
                    buffer2 = _a.sent();
                    chai_1.expect(cache.length).to.equal(1);
                    ctx.stop(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it("makes BufferSource", function () { return __awaiter(void 0, void 0, void 0, function () {
        var cache, note, brs, offset, buffer, n;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cache = initCache(ctx);
                    note = midi_buffer_source_1.parseMidiCSV("clarinet,67,,,0,116");
                    return [4 /*yield*/, midi_buffer_source_1.loadBuffer(ctx, note, cache)];
                case 1:
                    _a.sent();
                    brs = new audio_data_source_1.BufferSource(ctx, {
                        start: tickToTime(note.start),
                        end: tickToTime(note.start + note.duration),
                        getBuffer: function () { return cache.read("" + note.instrument + note.note); },
                    });
                    offset = 0;
                    buffer = brs.pullFrame();
                    buffer.readInt16LE(offset);
                    while (offset < ctx.blockSize) {
                        n = buffer.readInt16LE(offset);
                        offset += 2;
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    it("add as a track to ssr context", function (done) {
        var line = "clarinet,67,0.14150849999999998,,0,116";
        var note = midi_buffer_source_1.parseMidiCSV(line);
        var ctx = new ssrctx_1.SSRContext({
            nChannels: 1,
            bitDepth: 16,
            sampleRate: 9000,
        });
        var cache = initCache(ctx);
        midi_buffer_source_1.loadBuffer(ctx, note, cache).then(function (buffer) {
            new audio_data_source_1.BufferSource(ctx, {
                start: tickToTime(note.start),
                end: tickToTime(note.start + note.duration),
                buffer: buffer,
            });
            var output = fs_1.createWriteStream("outputfile.wav");
            output.write(new Uint8Array(ctx.WAVHeader));
            ctx.connect(output);
            ctx.start();
            setTimeout(function () {
                // execSync("ffplay -i outputfile.wav");
                ctx.stop(0);
                done();
            }, 400);
        });
    }).timeout(2000);
});
// describe("test", () => {
//   it("test", () => {
//     async function test() {
//       const ctx = new SSRContext({
//         nChannels: 2,
//         bitDepth: 16,
//         sampleRate: 44100,
//       });
//       const cache = initCache(ctx);
//       const note = parseMidiCSV("clarinet,67,,,0,116");
//       await loadBuffer(ctx, note, cache);
//       console.log(note.start);
//       const brs = new BufferSource(ctx, {
//         start: tickToTime(note.start),
//         end: tickToTime(note.start + note.duration),
//         getBuffer: () => cache.read(`${note.instrument}${note.note}`),
//       });
//       console.log(brs._start);
//       brs.connect(ctx);
//       const pt = new PassThrough();
//       const wt = createWriteStream("t1.wav");
//       ctx.connect(wt);
//       ctx.start();
//       pt.on("data", (d) => {
//         let offset = 0;
//         while (offset * 2 < d.byteLength - 2) {
//           const n = d.readInt16LE(offset);
//           offset++;
//           process.stdout.write(n + "\n");
//         }
//       });
//       // while (offset * 2 < buffer.byteLength - 2) {
//       // 	const n = buffer.readInt16LE(offset);
//       // 	offset++;
//       // 	process.stdout.write(n + ",");
//       // }
//     }
//     // test();
//   });
// });
