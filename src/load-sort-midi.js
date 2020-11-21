"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.midiTrackGenerator = void 0;
var midi_1 = require("@tonejs/midi");
var events_1 = require("events");
var fs_1 = require("fs");
var path_1 = require("path");
var ffmpegd_1 = require("../ffmpegd/ffmpegd");
var combine_notes_1 = require("./combine-notes");
var Ticker = /** @class */ (function (_super) {
    __extends(Ticker, _super);
    function Ticker() {
        var _this = _super.call(this) || this;
        _this.bpm = 60;
        _this.tick = 0;
        _this.qpp = 120;
        _this.doTick = function () {
            _this.tick += _this.qpp / 2;
            _this.emit("tick", _this.tick);
            process.stdout.write("*");
        };
        _this.resume = function () {
            var t = _this.doTick;
            _this.timer = setInterval(t, 60000 / _this.bpm / 2);
        };
        _this.stop = function () {
            _this.emit("stop");
            clearTimeout(_this.timer);
        };
        _this.step = function () {
            _this.emit("tick");
        };
        return _this;
    }
    return Ticker;
}(events_1.EventEmitter));
var ticker = new Ticker();
var look_ahead_measures = 2;
function midiTrackGenerator(filename) {
    var _a, header, tracks, stageNextNoteInTrack, staging, i, note, midinote;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = new midi_1.Midi(fs_1.readFileSync(filename).buffer), header = _a.header, tracks = _a.tracks;
                stageNextNoteInTrack = function (track) {
                    var tmeasure = header.ticksToMeasures(ticker.tick);
                    var noteMeasure = header.ticksToMeasures(track.notes[0].ticks);
                    return Math.floor(noteMeasure) - tmeasure <= look_ahead_measures;
                };
                _b.label = 1;
            case 1:
                if (!tracks.length) return [3 /*break*/, 3];
                staging = [];
                for (i = 0; i < tracks.length; i++) {
                    if (!tracks[i].notes.length) {
                        tracks = tracks.splice(i, 1);
                        continue;
                    }
                    if (stageNextNoteInTrack(tracks[i])) {
                        note = tracks[i].notes.shift();
                        midinote = {
                            instrument: tracks[i].instrument.name,
                            midi: note.midi,
                            measure: header.ticksToMeasures(note.ticks),
                            duration: note.durationTicks,
                            start: note.ticks,
                            end: note.ticks + note.durationTicks,
                        };
                        staging.push(midinote);
                    }
                }
                return [4 /*yield*/, combine_notes_1.combineNotes(staging)];
            case 2:
                _b.sent();
                return [3 /*break*/, 1];
            case 3: return [2 /*return*/];
        }
    });
}
exports.midiTrackGenerator = midiTrackGenerator;
var gen = midiTrackGenerator(path_1.resolve(__dirname, "../song.mid"));
var ffmpegd = new ffmpegd_1.Ffmpegd({ n: 8 });
ticker.on("tick", function () {
    var _a = gen.next(), done = _a.done, value = _a.value;
    value[0].midis.console.log(value[0].midis);
});
process.stdin.on("data", function (d) {
    console.log(d.toString().trim());
    switch (d.toString().trim()) {
        case "a":
            ticker.stop();
            break;
        case "d":
            ticker.resume();
            break;
        case "s":
            ticker.step();
            break;
    }
});
