"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.U32toF32 = exports.router = void 0;
var child_process_1 = require("child_process");
var audio_data_source_1 = require("./audio-data-source");
var ssrctx_1 = require("./ssrctx");
var path_1 = require("path");
var grep_transform_1 = require("grep-transform");
var fs_1 = require("fs");
var files = __spreadArrays(["synth/440/-ac2-f32le.wav", "synth/440/-ac2-s16le.wav"], child_process_1.execSync("ls samples/*pcm").toString().trim().split(/\s+/));
var express = require("express");
exports.router = express.Router();
exports.router.use("*", function (req, res, next) {
    res.set("Access-Control-Allow-Origin", "*");
    next();
});
exports.router.use("/mp3", function (req, res) {
    var files = child_process_1.execSync("ls -R **/*.mp3").toString().trim().split(/\s+/);
    res.json(files);
    res.end();
});
exports.router.get("/r", function (req, res) {
    res.status(200);
    res.contentType("text/html");
    grep_transform_1.LSSource(path_1.resolve(__dirname, "../db"))
        .pipe(new grep_transform_1.ReadlineTransform())
        .pipe(new grep_transform_1.LSGraph())
        .on("data", function (d) {
        res.write(d.toString());
    })
        .on("end", function () { return res.end(); });
});
function U32toF32(i) {
    if (i === 0)
        return 0;
    var r = i & ((1 << 23) - 1);
    1;
    r /= 1 << 23;
    r += 1.0;
    var bias = 127;
    var shift = ((i >> 23) & 0xff) - bias;
    for (; shift > 0; shift--)
        r *= 2;
    for (; shift < 0; shift++)
        r /= 2;
    return r;
}
exports.U32toF32 = U32toF32;
exports.router.get("/samples/:filename", function (req, res) {
    var filename = path_1.resolve(__dirname, "../samples/", req.params.filename);
    if (!fs_1.existsSync(filename)) {
        res.writeHead(404);
        return;
    }
    var ctx = ssrctx_1.SSRContext.fromWAVFile(filename);
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "audio/x-wav",
        "x-sample-rate": ctx.sampleRate,
        "x-bit-depth": ctx.bitDepth,
        "x-n-channel": ctx.nChannels,
    });
    ctx.fps = 10;
    ctx.connect(res);
    var fsrc = new audio_data_source_1.FileSource(ctx, {
        filePath: filename,
    });
    fsrc.connect(ctx);
    ctx.start();
    res.on("close", function () { return ctx.stop(); });
    req.socket.on("close", function () { return ctx.stop(); });
});
exports.router.get("/synth/:freq/:desc.wav", function (req, res) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "x-audio/WAVE",
    });
    var ctx = ssrctx_1.SSRContext.fromFileName(req.params.desc);
    var osc = new audio_data_source_1.Oscillator(ctx, { frequency: parseFloat(req.params.freq) });
    res.write(osc.header);
    osc.connect(ctx);
    ctx.connect(res);
    ctx.on("end", function () {
        res.end();
    });
    ctx.start();
    ctx.stop(2);
});
exports.router.get("/db/:dir/:file", function (req, res) {
    var path = path_1.resolve("db", req.params.dir, req.params.file); //, req.url.search["path"]);
    res.end(path);
});
exports.router.get("/synth/:freq/:desc", function (req, res) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "inline",
    });
    var ctx = ssrctx_1.SSRContext.fromFileName(req.params.desc);
    var osc = new audio_data_source_1.Oscillator(ctx, { frequency: parseFloat(req.params.freq) });
    osc.connect(ctx);
    ctx.connect(res);
    ctx.on("end", function () {
        res.end();
    });
    ctx.start();
    ctx.stop(2);
});
var fpath = function (uri) { return path_1.resolve(__dirname, "../../radar/public/" + uri); };
exports.router.use("/build/:file", function (req, res) {
    console.log(req.params.file);
    res.sendFile(fpath("build/" + req.params.file));
});
exports.router.use("/", function (req, res) {
    var fpath = path_1.resolve(__dirname, "../../public/" + req.url);
    res.end("\n\t\t<html>\n\t\t<head>\n\t\t</head>\n\t\t<body>\n\t\t<div id='container'>\n\t\t\t<div id='menu'>\n\t\t\t\t" + files.map(function (f) { return "<li><button href='" + f + "'>" + path_1.basename(f) + "</button><li>"; }).join("") + "\n\t\t\t</div>\n\n\t\t\t<div id='stdout'></div>\n\t\t\t<input type='file' value='sele'>input</input>\n\t\t\t<input size=80 autofocus ></input>\n\t\t</div>\n\t\t<div id='rx'>\n\t\t\t<div id='rx1'></div>\n\t\t\t<div id='rx2'></div>\n\t\t</div>\n    <script src='./build/esm/templateUI.js' type='module'>\n    \n\t\t</script>\n\t\t</body>\n\t\t</html>\n\t\t");
});
if (require.main === module) {
    var app = express();
    app.engine("tag", function (filename, options, callback) {
        function toks(str) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
        }
    });
    app.use("/node", exports.router);
    app.use("/", exports.router);
    app.listen(3000);
    setInterval(function () {
        console.log(process.memoryUsage());
    }, 20200);
}
