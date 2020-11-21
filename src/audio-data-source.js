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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferSource = exports.FileSource = exports.Oscillator = void 0;
var fs_1 = require("fs");
var stream_1 = require("stream");
var events_1 = require("events");
var Oscillator = /** @class */ (function () {
    function Oscillator(ctx, _a) {
        var frequency = _a.frequency;
        this.active = true;
        this._ended = false;
        this.ctx = ctx;
        this.frequency = frequency;
        this.bytesPerSample = this.ctx.sampleArray.BYTES_PER_ELEMENT;
        this.connect(ctx);
    }
    Object.defineProperty(Oscillator.prototype, "header", {
        get: function () {
            return Buffer.from(this.ctx.WAVHeader);
        },
        enumerable: false,
        configurable: true
    });
    Oscillator.prototype.pullFrame = function () {
        if (!this.active)
            return Buffer.alloc(0);
        var frames = Buffer.allocUnsafe(this.ctx.blockSize);
        var n = this.ctx.frameNumber;
        var cyclePerSample = (3.14 * 2 * this.frequency) / this.ctx.sampleRate;
        var cyclePerFrame = (3.14 * 2 * this.frequency) / this.ctx.fps;
        var phase = this.ctx.frameNumber * cyclePerFrame;
        for (var i = 0; i < this.ctx.samplesPerFrame; i++) {
            var idx = ~~(i / this.ctx.nChannels);
            this.ctx.encode(frames, Math.sin(phase + cyclePerSample * idx), i);
        }
        return frames;
    };
    Oscillator.prototype.start = function () {
        this.active = true;
    };
    Oscillator.prototype.stop = function () {
        this._ended = true;
        this.active = false;
    };
    Oscillator.prototype.connect = function (dest) {
        dest.inputs.push(this);
        return true;
    };
    Oscillator.prototype.ended = function () {
        return this._ended;
    };
    return Oscillator;
}());
exports.Oscillator = Oscillator;
var FileSource = /** @class */ (function (_super) {
    __extends(FileSource, _super);
    function FileSource(ctx, _a) {
        var filePath = _a.filePath;
        var _this = _super.call(this) || this;
        _this.active = true;
        _this._ended = false;
        _this.fd = fs_1.openSync(filePath, "r");
        _this.size = fs_1.statSync(filePath).size;
        _this.ctx = ctx;
        _this.offset = 0;
        return _this;
    }
    FileSource.prototype.pullFrame = function () {
        var ob = Buffer.allocUnsafe(this.ctx.blockSize);
        fs_1.readSync(this.fd, ob, 0, ob.byteLength, this.offset);
        this.offset += ob.byteLength;
        if (this.offset > this.size) {
            this._ended = true;
            this.stop();
        }
        return ob;
    };
    FileSource.prototype.connect = function (dest) {
        dest.inputs.push(this);
        return true;
    };
    FileSource.prototype.stop = function () {
        fs_1.closeSync(this.fd);
    };
    FileSource.prototype.ended = function () {
        return this._ended;
    };
    return FileSource;
}(events_1.EventEmitter));
exports.FileSource = FileSource;
var BufferSource = /** @class */ (function (_super) {
    __extends(BufferSource, _super);
    function BufferSource(ctx, props) {
        var _this = _super.call(this) || this;
        _this.ctx = ctx;
        _this.buffer = props.buffer;
        var getBuffer = props.getBuffer, start = props.start, end = props.end;
        _this._start = start;
        _this._end = end;
        _this._getBuffer = getBuffer;
        console.log(start, end);
        return _this;
    }
    BufferSource.prototype.prepare = function () { };
    BufferSource.prototype.start = function (when) {
        this._start = when || this.ctx.currentTime;
    };
    BufferSource.prototype.stop = function (when) {
        this._end = when || this.ctx.currentTime;
    };
    Object.defineProperty(BufferSource.prototype, "active", {
        get: function () {
            return this.ctx.currentTime <= this._end && this.ctx.currentTime >= this._start;
        },
        enumerable: false,
        configurable: true
    });
    BufferSource.prototype.pullFrame = function () {
        if (!this.active)
            return Buffer.alloc(0);
        if (!this.buffer)
            this.buffer = this._getBuffer();
        var ret = this.buffer.slice(0, this.ctx.blockSize);
        this.buffer = this.buffer.slice(this.ctx.blockSize);
        return ret;
    };
    BufferSource.prototype.connect = function (dest) {
        dest.inputs.push(this);
        return true;
    };
    BufferSource.prototype.ended = function () {
        return this.ctx.currentTime > this._end;
    };
    BufferSource.prototype.dealloc = function () { };
    return BufferSource;
}(stream_1.Readable));
exports.BufferSource = BufferSource;
