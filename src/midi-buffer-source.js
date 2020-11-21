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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playCsv = exports.playCSVmidi = exports.loadBuffer = exports.parseMidiCSV = void 0;
var fs_1 = require("fs");
var audio_data_source_1 = require("./audio-data-source");
var ffmpeg_link_1 = require("./ffmpeg-link");
var ssrctx_1 = require("./ssrctx");
var flat_cache_store_1 = require("./flat-cache-store");
var path_1 = require("path");
var midi_1 = require("@tonejs/midi");
/**
 * clarinet,67,0.28301699999999996,,256,116
 */
exports.parseMidiCSV = function (line) {
    var _a = line.split(","), instrument = _a[0], note = _a[1], duration = _a[2], start = _a[3], end = _a[4];
    return {
        instrument: instrument,
        note: parseInt(note),
        duration: parseFloat(duration),
        start: parseFloat(start),
        end: parseFloat(end),
    };
};
exports.loadBuffer = function (ctx, note, noteCache) { return __awaiter(void 0, void 0, void 0, function () {
    var aoptions, format, input, cacheKey, ob, cmd, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, 3, 4]);
                aoptions = "-ac " + ctx.nChannels + " -ar " + ctx.sampleRate;
                format = "" + (ctx.bitDepth === 16 ? "s16le" : "f32le");
                input = "db/Fatboy_" + note.instrument + "/" + note.note + ".mp3";
                cacheKey = "" + note.instrument + note.note;
                if (noteCache.cacheKeys.includes(cacheKey) && noteCache.read(cacheKey) !== null) {
                    return [2 /*return*/, noteCache.read(cacheKey)];
                }
                ob = noteCache.malloc(cacheKey);
                cmd = "-hide_banner -loglevel panic -t 2 -i " + input + " -f " + format + " " + aoptions + " pipe:1";
                return [4 /*yield*/, ffmpeg_link_1.cspawnToBuffer("ffmpeg", cmd, ob)];
            case 1:
                _a.sent();
                return [2 /*return*/, ob];
            case 2:
                e_1 = _a.sent();
                console.error(e_1);
                return [3 /*break*/, 4];
            case 3: return [7 /*endfinally*/];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.playCSVmidi = function (ctx, notes, cacheFileName) { return __awaiter(void 0, void 0, void 0, function () {
    var uniqs, uniqNotes, noteCache, _a, _b, brs, e_2_1;
    var e_2, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                uniqs = new Set();
                uniqNotes = notes.map(function (n) { return uniqs.add(n.instrument + n.note); });
                noteCache = new flat_cache_store_1.CacheStore(uniqNotes.length, ctx.bytesPerSecond * 2, cacheFileName);
                _d.label = 1;
            case 1:
                _d.trys.push([1, 6, 7, 12]);
                _a = __asyncValues((function () {
                    return __asyncGenerator(this, arguments, function () {
                        var _loop_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _loop_1 = function () {
                                        var note, brs_1;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    note = notes.shift();
                                                    return [4 /*yield*/, __await(exports.loadBuffer(ctx, note, noteCache))];
                                                case 1:
                                                    _a.sent();
                                                    brs_1 = new audio_data_source_1.BufferSource(ctx, {
                                                        start: note.start - 40,
                                                        end: note.end - 40,
                                                        getBuffer: function () { return noteCache.read("" + note.instrument + note.note); },
                                                    });
                                                    brs_1.connect(ctx);
                                                    return [4 /*yield*/, __await(brs_1)];
                                                case 2: return [4 /*yield*/, _a.sent()];
                                                case 3:
                                                    _a.sent();
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _a.label = 1;
                                case 1:
                                    if (!notes.length) return [3 /*break*/, 3];
                                    return [5 /*yield**/, _loop_1()];
                                case 2:
                                    _a.sent();
                                    return [3 /*break*/, 1];
                                case 3: return [2 /*return*/];
                            }
                        });
                    });
                })());
                _d.label = 2;
            case 2: return [4 /*yield*/, _a.next()];
            case 3:
                if (!(_b = _d.sent(), !_b.done)) return [3 /*break*/, 5];
                brs = _b.value;
                _d.label = 4;
            case 4: return [3 /*break*/, 2];
            case 5: return [3 /*break*/, 12];
            case 6:
                e_2_1 = _d.sent();
                e_2 = { error: e_2_1 };
                return [3 /*break*/, 12];
            case 7:
                _d.trys.push([7, , 10, 11]);
                if (!(_b && !_b.done && (_c = _a.return))) return [3 /*break*/, 9];
                return [4 /*yield*/, _c.call(_a)];
            case 8:
                _d.sent();
                _d.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                if (e_2) throw e_2.error;
                return [7 /*endfinally*/];
            case 11: return [7 /*endfinally*/];
            case 12:
                noteCache.persist();
                return [2 /*return*/];
        }
    });
}); };
var filename = "../Beethoven-Symphony5-1.mid";
var writeToCsv = function (filename) {
    var wfs = path_1.resolve(__dirname, "../csv/", path_1.basename(filename) + ".csv");
    var _a = new midi_1.Midi(fs_1.readFileSync(path_1.resolve(__dirname, filename)).buffer), header = _a.header, tracks = _a.tracks;
    fs_1.writeFileSync(wfs, header.name);
    fs_1.appendFileSync(wfs, "\n#inst,midi,duration,statt,end");
    tracks.map(function (t) {
        t.notes.map(function (note) {
            var obj = {
                instrument: t.instrument.name.replace(" ", "_").replace(" ", "_").replace(" ", "_").replace("(", "").replace(")", ""),
                note: note.midi,
                duration: header.ticksToSeconds(note.durationTicks),
                start: header.ticksToSeconds(note.ticks),
                end: header.ticksToSeconds(note.ticks) + header.ticksToSeconds(note.durationTicks),
            };
            fs_1.appendFileSync(wfs, "\n" + Object.values(obj).join(","));
            console.log(obj);
        });
    });
    return filename + ".csv";
};
var ctx = ssrctx_1.SSRContext.fromFileName("-ac1-s16le");
//  playCSVmidi(ctx, notes, t.instrument.name);
// playCSVmidi(ctx, resolve(__dirname, "../csv/mid2.csv"));
// ctx.connect(createWriteStream("mid2.wav"));
// ctx.start();
function playCsv(ctx, csv, outfile) {
    var e_3, _a;
    return __awaiter(this, void 0, void 0, function () {
        var uniqNotes, noteCache, notes, _b, _c, brs, e_3_1, fs;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    uniqNotes = parseInt(require("child_process").execSync("cat " + csv + " |cut -f1,2 -d',' |sort|uniq|wc -l").toString().trim());
                    noteCache = new flat_cache_store_1.CacheStore(uniqNotes, ctx.bytesPerSecond * 2, path_1.resolve("db/cache/" + path_1.basename(csv)));
                    notes = fs_1.readFileSync(csv)
                        .toString()
                        .trim()
                        .split("\n")
                        .map(function (line) { return exports.parseMidiCSV(line); });
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 6, 7, 12]);
                    _b = __asyncValues((function () {
                        return __asyncGenerator(this, arguments, function () {
                            var _loop_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _loop_2 = function () {
                                            var note, brs_2;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        note = notes.shift();
                                                        brs_2 = new audio_data_source_1.BufferSource(ctx, {
                                                            start: note.start,
                                                            end: note.end,
                                                            getBuffer: function () { return noteCache.read("" + note.instrument + note.note); },
                                                        });
                                                        return [4 /*yield*/, __await(exports.loadBuffer(ctx, note, noteCache))];
                                                    case 1:
                                                        _a.sent();
                                                        return [4 /*yield*/, __await(brs_2)];
                                                    case 2: return [4 /*yield*/, _a.sent()];
                                                    case 3:
                                                        _a.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        };
                                        _a.label = 1;
                                    case 1:
                                        if (!notes.length) return [3 /*break*/, 3];
                                        return [5 /*yield**/, _loop_2()];
                                    case 2:
                                        _a.sent();
                                        return [3 /*break*/, 1];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        });
                    })());
                    _d.label = 2;
                case 2: return [4 /*yield*/, _b.next()];
                case 3:
                    if (!(_c = _d.sent(), !_c.done)) return [3 /*break*/, 5];
                    brs = _c.value;
                    ctx.inputs.push(brs);
                    _d.label = 4;
                case 4: return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 12];
                case 6:
                    e_3_1 = _d.sent();
                    e_3 = { error: e_3_1 };
                    return [3 /*break*/, 12];
                case 7:
                    _d.trys.push([7, , 10, 11]);
                    if (!(_c && !_c.done && (_a = _b.return))) return [3 /*break*/, 9];
                    return [4 /*yield*/, _a.call(_b)];
                case 8:
                    _d.sent();
                    _d.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    if (e_3) throw e_3.error;
                    return [7 /*endfinally*/];
                case 11: return [7 /*endfinally*/];
                case 12:
                    noteCache.persist();
                    fs = fs_1.createWriteStream(outfile);
                    ctx.connect(fs_1.createWriteStream(outfile));
                    ctx.prepareUpcoming();
                    ctx.on("data", function (d) {
                        console.log(".");
                        fs.write(d);
                    });
                    ctx.start();
                    return [2 /*return*/, ctx];
            }
        });
    });
}
exports.playCsv = playCsv;
//writeToCsv("../Beethoven-Symphony5-1.mid");
playCsv(ctx, "./csv/sorted.csv", "midi.wav");
