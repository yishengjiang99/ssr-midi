"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCache = exports.parseMidiCSV = exports.tickToTime = void 0;
const fs_1 = require("fs");
const audio_data_source_1 = require("./audio-data-source");
const ffmpeg_link_1 = require("./ffmpeg-link");
const ssrctx_1 = require("./ssrctx");
const flat_cache_store_1 = require("./flat-cache-store");
const child_process_1 = require("child_process");
exports.tickToTime = (t) => t / 1000;
exports.parseMidiCSV = (line) => {
    const [instrument, note, _, _2, start, duration] = line.split(",");
    return {
        instrument: instrument
            .replace(" ", "_")
            .replace(" ", "_")
            .replace(" ", "_"),
        midi: parseInt(note) - 21,
        start: exports.tickToTime(parseInt(start)),
        duration: exports.tickToTime(parseInt(duration)),
    };
};
exports.initCache = (ctx) => {
    const byteLength = ctx.bytesPerSecond * 2;
    return new flat_cache_store_1.CacheStore(221, byteLength);
};
async function t2(ctxstr, midiFile, outfile) {
    const ctx = ssrctx_1.SSRContext.fromFileName(ctxstr);
    const outfilefs = fs_1.createWriteStream(outfile);
    const uniqNotes = parseInt(child_process_1.execSync(`cat ${midiFile} |cut -f1,2 -d',' |sort|uniq|wc -l`)
        .toString()
        .trim());
    const noteCache = new flat_cache_store_1.CacheStore(uniqNotes * 10, ctx.bytesPerSecond * 2, `db/cache/${ctxstr}${midiFile}`);
    let lines = fs_1.readFileSync(midiFile).toString().trim().split("\n");
    let notes = lines.reduce((array, line, _, arr) => {
        const tokens = line.split(",");
        const note = exports.parseMidiCSV(line);
        const { instrument, start, duration, midi } = note;
        const lastNote = array.length > 0 && array[array.length - 1];
        if (lastNote.start === start && lastNote) {
            lastNote.midis.push(note);
        }
        else {
            array.push({
                start: start,
                midis: [note],
            });
        }
        return array;
    }, new Array());
    const aoptions = `-ac ${ctx.nChannels} -ar ${ctx.sampleRate}`;
    const format = `${ctx.bitDepth === 16 ? "s16le" : "f32le"}`;
    for await (const noteBuffer of (async function* () {
        while (notes.length) {
            const note = notes.shift();
            const obs = new audio_data_source_1.BufferSource(ctx, {
                buffer: await ffmpeg_link_1.combinemp3(note, noteCache, format, aoptions),
                start: note.start,
                end: note.start + note.midis[0].duration,
            });
            obs.connect(ctx);
        }
    })()) {
        //console.log(noteBuffer);
    }
    ctx.connect(outfilefs);
    ctx.start();
    noteCache.persist();
}
t2("s16le-ar48000-ac2-", "string-midi.csv", "string-highres.wav");
//# sourceMappingURL=combine_notemidi.js.map