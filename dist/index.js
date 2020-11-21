"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const audio_data_source_1 = require("./audio-data-source");
const ssrctx_1 = require("./ssrctx");
const path_1 = require("path");
const grep_transform_1 = require("grep-transform");
const fs_1 = require("fs");
let files = [
    "synth/440/-ac2-f32le.wav",
    "synth/440/-ac2-s16le.wav",
    ...child_process_1.execSync("ls samples/*wav").toString().trim().split(/\s+/),
];
var finalhandler = require("finalhandler");
var http = require("http");
var Router = require("router");
var router = Router();
router.use("*", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.log(res.headersSent);
    next();
});
router.use("/mp3", (req, res) => {
    const files = child_process_1.execSync("ls -R **/*.mp3").toString().trim().split(/\s+/);
    res.end(JSON.stringify(files));
});
router.get("/r", (req, res) => {
    res.writeHeader(200, {
        "Content-Type": "text/html",
    });
    grep_transform_1.LSSource(path_1.resolve(__dirname, "../db"))
        .pipe(new grep_transform_1.ReadlineTransform())
        .pipe(new grep_transform_1.LSGraph())
        .on("data", (d) => {
        res.write(d.toString());
    })
        .on("end", () => res.end());
});
router.get("/samples/:filename", (req, res) => {
    const filename = path_1.resolve(__dirname, "../samples/", req.params.filename);
    if (!fs_1.existsSync(filename)) {
        res.writeHead(404);
        return;
    }
    const ctx = ssrctx_1.SSRContext.fromWAVFile(filename);
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "audio/x-wav",
        "x-sample-rate": ctx.sampleRate,
        "x-bit-depth": ctx.bitDepth,
        "x-n-channel": ctx.nChannels,
    });
    ctx.fps = 10;
    ctx.connect(res);
    const fsrc = new audio_data_source_1.FileSource(ctx, {
        filePath: filename,
    });
    fsrc.connect(ctx);
    ctx.start();
    res.on("close", () => ctx.stop());
    req.socket.on("close", () => ctx.stop());
});
router.get("/synth/:freq/:desc.wav", (req, res) => {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "x-audio/WAVE",
    });
    const ctx = ssrctx_1.SSRContext.fromFileName(req.params.desc);
    const osc = new audio_data_source_1.Oscillator(ctx, { frequency: parseFloat(req.params.freq) });
    res.write(osc.header);
    osc.connect(ctx);
    ctx.connect(res);
    ctx.on("end", () => {
        res.end();
    });
    ctx.start();
    ctx.stop(2);
});
router.get("/synth/:freq/:desc", (req, res) => {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "inline",
    });
    const ctx = ssrctx_1.SSRContext.fromFileName(req.params.desc);
    const osc = new audio_data_source_1.Oscillator(ctx, { frequency: parseFloat(req.params.freq) });
    osc.connect(ctx);
    ctx.connect(res);
    ctx.on("end", () => {
        res.end();
    });
    ctx.start();
    ctx.stop(2);
});
router.use("/build/:jsfile", (req, res) => {
    console.log("rs");
    res.writeHeader(200, {
        "Content-Type": "application/javascript",
    });
    fs_1.createReadStream(path_1.resolve(__dirname, `../../build/${req.params.jsfile}`)).pipe(res);
});
router.use("/", (req, res) => {
    res.end(templateURL({
        main: files
            .map((f) => `<button href='${f}'>${f}</button>`)
            .join(""),
        mainjs: "/build/Main.js",
        preJs: "",
    }));
});
var server = http.createServer(function (req, res) {
    router(req, res, finalhandler(req, res));
});
server.listen(3000);
function templateURL(props) {
    const { main, mainjs, preJs } = props;
    return `<html>
	<head>
	${preJs ? `<script src='${preJs}'></script>` : ""}
	</head>
	<body>
	<div id='container'>
		<div id='menu'>
			${main}
		</div>
		<div id='stdout'></div>
		<input size=80 autofocus ></input>
	</div>
	<div id='rx'>
		<div id='rx1'></div>
		<div id='rx2'></div>
	</div>
	<input type='file' value='sele'>input</input>
	<script src='${mainjs}'>
	</script>
	</body>
	</html>`;
}
//# sourceMappingURL=index.js.map