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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSRContext = exports.timediff = void 0;
var events_1 = require("events");
var wav_header_1 = require("./wav-header");
var kodak_1 = require("./kodak");
exports.timediff = function (t1, t2) {
    return t1[0] + t1[1] / 1e9 - (t2[0] + t2[1] / 1e9);
};
//#endregion
var SSRContext = /** @class */ (function (_super) {
    __extends(SSRContext, _super);
    function SSRContext(props) {
        if (props === void 0) { props = SSRContext.defaultProps; }
        var _this = _super.call(this) || this;
        _this.inputs = [];
        _this.start = function () {
            _this.playing = true;
            if (_this.output === null)
                return;
            var that = _this;
            _this.emit("data", Buffer.from(_this.WAVHeader));
            var timer = setInterval(function () {
                that.pump();
                if (!that.playing || (that.end && that.currentTime >= that.end)) {
                    that.stop(0);
                    clearInterval(timer);
                }
                _this.prepareUpcoming();
            }, _this.secondsPerFrame);
        };
        var _a = __assign(__assign({}, SSRContext.defaultProps), props), nChannels = _a.nChannels, sampleRate = _a.sampleRate, fps = _a.fps, bitDepth = _a.bitDepth;
        _this.nChannels = nChannels;
        _this.sampleRate = sampleRate;
        _this.fps = sampleRate / 128;
        _this.frameNumber = 0;
        _this.bitDepth = bitDepth;
        _this.encoder = new kodak_1.Encoder(_this.bitDepth);
        _this.decoder = new kodak_1.Decoder(_this.bitDepth);
        _this.playing = true;
        return _this;
    }
    Object.defineProperty(SSRContext.prototype, "secondsPerFrame", {
        get: function () {
            return 1 / this.fps;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SSRContext.prototype, "samplesPerFrame", {
        get: function () {
            return (this.sampleRate * this.nChannels) / this.fps;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SSRContext.prototype, "inputSources", {
        get: function () {
            return this.inputs.filter(function (i) { return i.active; });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SSRContext.prototype, "WAVHeader", {
        get: function () {
            return wav_header_1.wavHeader(30 * this.sampleRate, this.sampleRate, this.nChannels, this.bitDepth);
        },
        enumerable: false,
        configurable: true
    });
    SSRContext.prototype.encode = function (buffer, value, index) {
        this.encoder.encode(buffer, value, index);
    };
    Object.defineProperty(SSRContext.prototype, "sampleArray", {
        get: function () {
            switch (this.bitDepth) {
                case 32:
                    return Uint32Array;
                case 16:
                    return Int16Array;
                case 8:
                    return Uint8Array;
                default:
                    return Int16Array;
            }
        },
        enumerable: false,
        configurable: true
    });
    SSRContext.prototype.pump = function () {
        this.lastFrame = process.hrtime();
        var ok = true;
        this.frameNumber++;
        for (var i = 0; i < this.inputSources.length; i++) {
            var b = this.inputSources[i].pullFrame();
            b && this.emit("data", b);
        }
        return ok;
    };
    SSRContext.prototype.prepareUpcoming = function () {
        var _a;
        var newInputs = [];
        var t = this.currentTime;
        for (var i = 0; i < this.inputs.length; i++) {
            if (this.inputs[i].ended() === false) {
                newInputs.push(this.inputs[i]);
                (_a = this.inputs[i]) === null || _a === void 0 ? void 0 : _a.prepare(t);
            }
        }
        this.inputs = newInputs;
        if (this.inputs.length === 0) {
            this.stop(0);
        }
    };
    Object.defineProperty(SSRContext.prototype, "blockSize", {
        get: function () {
            return this.samplesPerFrame * this.sampleArray.BYTES_PER_ELEMENT;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SSRContext.prototype, "currentTime", {
        get: function () {
            return this.frameNumber * this.secondsPerFrame;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SSRContext.prototype, "bytesPerSecond", {
        get: function () {
            return this.sampleRate * this.nChannels * this.sampleArray.BYTES_PER_ELEMENT;
        },
        enumerable: false,
        configurable: true
    });
    SSRContext.prototype.connect = function (destination) {
        this.output = destination;
    };
    SSRContext.prototype.getRms = function () { };
    SSRContext.prototype.stop = function (second) {
        if (second === 0) {
            this.playing = false;
            this.emit("finish");
            this.inputs.forEach(function (input) { return input.stop(); });
        }
        else {
            this.end = second;
        }
    };
    SSRContext.prototype.run = function () {
        while (true) {
            this.pump();
        }
    };
    SSRContext.fromWAVFile = function (path) {
        return wav_header_1.readHeader(path);
    };
    SSRContext.fromFileName = function (filename) {
        var nChannels = filename.match(/\-ac(\d+)\-/) ? parseInt(filename.match(/\-ac(\d+)\-/)[1]) : 2;
        var sampleRate = (filename.match(/\-ar(\d+)\-/) && parseInt(filename.match(/\-ar(\d+)\-/)[1])) || 44100;
        var bitDepth = filename.includes("f32le") ? 32 : 16;
        return new SSRContext({
            sampleRate: sampleRate,
            nChannels: nChannels,
            fps: sampleRate / 128 / 50,
            bitDepth: bitDepth,
        });
    };
    SSRContext.defaultProps = {
        nChannels: 2,
        sampleRate: 44100,
        bitDepth: 16,
    };
    return SSRContext;
}(events_1.EventEmitter));
exports.SSRContext = SSRContext;
// const ctx = SSRContext.fromFileName("-ac1-s16le");
// playCSVmidi(ctx, resolve(__dirname, "../csv/midi.csv"));
// ctx.connect(createWriteStream("mid2.wav"));
// ctx.start();
