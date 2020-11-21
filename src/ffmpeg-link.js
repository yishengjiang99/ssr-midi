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
exports.spawnInputBuffer = exports.combinemp3 = exports.mp3db = exports.ffmpegToBuffer = exports.cspawnToBuffer = exports.castInput = exports.pcm_note_size = void 0;
var child_process_1 = require("child_process");
var stream_1 = require("stream");
var fs_1 = require("fs");
var path_1 = require("path");
exports.pcm_note_size = 76216696 / 88;
exports.castInput = function () {
    fs_1.unlinkSync("input2");
    child_process_1.execSync("mkfifo input2");
    var pt = new stream_1.PassThrough();
    var ff = child_process_1.spawn("ffmpeg", "-debug-level=trace -i pipe:0 -re -f mulaw -f rtp rtp://127.0.0.1:1234".split(" "));
    pt.pipe(ff.stdin);
    ff.on("error", console.error);
    return pt;
};
exports.cspawnToBuffer = function (cmd, str, ob) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                    var _a = child_process_1.spawn(cmd, str.split(" ")), stdout = _a.stdout, stderr = _a.stderr;
                    var offset = 0;
                    stdout.on("data", function (chunk) {
                        if (offset + chunk.byteLength > ob.byteLength) {
                            console.trace();
                            console.log(offset, chunk.byteLength, ob.byteLength);
                        }
                        else {
                            ob.set(chunk, offset);
                            offset += chunk.byteLength;
                        }
                    });
                    stdout.on("error", reject);
                    stderr.pipe(process.stdout);
                    stdout.on("end", resolve);
                })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
function ffmpegToBuffer(args, ob) {
    exports.cspawnToBuffer("ffmpeg", args, ob);
}
exports.ffmpegToBuffer = ffmpegToBuffer;
exports.mp3db = function (inst, midi) { return path_1.resolve(__dirname, "../db/", inst, midi + ".mp3"); };
exports.combinemp3 = function (combinedNote, noteCache, format, aoptions) { return __awaiter(void 0, void 0, void 0, function () {
    var cacheKey, inputStr, filterStr, ob, cmd;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                cacheKey = combinedNote.midis.map(function (note) { return "" + note.instrument + note.midi; }).join("_");
                if (noteCache.cacheKeys.includes(cacheKey)) {
                    return [2 /*return*/, noteCache.read(cacheKey)];
                }
                inputStr = combinedNote.midis.map(function (note) { return "-i db/Fatboy_" + note.instrument + "/" + note.midi + ".mp3"; }).join(" ");
                filterStr = "-filter_complex amix=inputs=" + combinedNote.midis.length;
                ob = noteCache.malloc(cacheKey);
                cmd = "-y -hide_banner -loglevel panic " + inputStr + " " + filterStr + " -t 2 -f " + format + " " + aoptions + " pipe:1";
                return [4 /*yield*/, exports.cspawnToBuffer("ffmpeg", cmd, ob)];
            case 1:
                _a.sent();
                return [2 /*return*/, ob];
        }
    });
}); };
exports.spawnInputBuffer = function (proc, buffer) {
    proc.on("error", console.error);
    var pt = new stream_1.PassThrough();
    pt.pipe(proc.stdin);
    pt.write(buffer);
};
