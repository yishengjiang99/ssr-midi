"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playCsv = exports.preCacheNotes = exports.loadBuffer = exports.initCache = exports.parseMidiCSV = exports.tickToTime = void 0;
const fs_1 = require("fs");
const audio_data_source_1 = require("./audio-data-source");
const ffmpeg_link_1 = require("./ffmpeg-link");
const ssrctx_1 = require("./ssrctx");
const flat_cache_store_1 = require("./flat-cache-store");
const child_process_1 = require("child_process");
const stream_1 = require("stream");
exports.tickToTime = (t) => t / 1000;
/**
 * clarinet,67,0.28301699999999996,,256,116
 */
exports.parseMidiCSV = (line) => {
  const [instrument, note, _, _2, start, duration] = line.split(",");
  return {
    instrument: instrument
      .replace(" ", "_")
      .replace(" ", "_")
      .replace(" ", "_"),
    note: parseInt(note) - 21,
    start: parseInt(start),
    duration: parseInt(duration),
  };
};
exports.initCache = (ctx) => {
  const byteLength = ctx.bytesPerSecond * 2;
  return new flat_cache_store_1.CacheStore(221, byteLength);
};
exports.loadBuffer = async (ctx, note, noteCache) => {
  try {
    const aoptions = `-ac ${ctx.nChannels} -ar ${ctx.sampleRate}`;
    const format = `${ctx.bitDepth === 16 ? "s16le" : "f32le"}`;
    const input = `db/Fatboy_${note.instrument}/${note.note}.mp3`;
    const cacheKey = `${note.instrument}${note.note}`;
    if (noteCache.cacheKeys.includes(cacheKey)) {
      return noteCache.read(cacheKey);
    }
    const bytes = ctx.bytesPerSecond * note.duration * 1.2;
    const ob = noteCache.malloc(cacheKey, bytes);
    const cmd = `-hide_banner -loglevel normal -t ${note.duration} -i ${input} -f ${format} ${aoptions} pipe:1`;
    await ffmpeg_link_1.cspawnToBuffer("ffmpeg", cmd, ob);
    return ob;
  } catch (e) {
    console.error(e);
  } finally {
  }
};
exports.preCacheNotes = async (ctxstr, midiFile) => {
  const ctx = ssrctx_1.SSRContext.fromFileName(ctxstr);
  const uniqNotes = parseInt(
    child_process_1
      .execSync(`cat ${midiFile} |cut -f1,2 -d',' |sort|uniq|wc -l`)
      .toString()
      .trim()
  );
  const noteCache = new flat_cache_store_1.CacheStore(
    uniqNotes,
    ctx.bytesPerSecond * 2,
    `db/cache/${ctxstr}${midiFile}`
  );
  let notes = fs_1
    .readFileSync(midiFile)
    .toString()
    .trim()
    .split("\n")
    .map((line) => exports.parseMidiCSV(line));
  for await (const _ of (async function* () {
    while (notes.length) {
      yield await exports.loadBuffer(ctx, notes.shift(), noteCache);
    }
  })());
  noteCache.persist();
  fs_1
    .readFileSync(midiFile)
    .toString()
    .trim()
    .split("\n")
    .map((line) => exports.parseMidiCSV(line))
    .map((note) => {
      const brs = new audio_data_source_1.BufferSource(ctx, {
        start: exports.tickToTime(note.start),
        end: exports.tickToTime(note.start + note.duration),
        getBuffer: () => noteCache.read(`${note.instrument}${note.note}`),
      });
      brs.connect(ctx);
    });
  return ctx;
};
function playCsv(ctxString, csv, outfile) {
  exports.preCacheNotes(ctxString, csv).then((ctx) => {
    const output = fs_1.createWriteStream(outfile);
    //	output.write(Buffer.from(ctx.WAVHeader));
    ctx.connect(output);
    ctx.start();
    ctx.on("data", (d) => {
      let offset = 0;
      while (offset * 2 < d.byteLength - 2) {
        const n = d.readInt16LE(offset);
        offset++;
        process.stdout.write(n + "\n");
      }
    });
  });
}
exports.playCsv = playCsv;
playCsv("s16le-ar9000-ac1-", "string-midi.csv", "clarinet.wav");
async function test() {
  const ctx = new ssrctx_1.SSRContext({
    nChannels: 2,
    bitDepth: 16,
    sampleRate: 44100,
  });
  const cache = exports.initCache(ctx);
  const note = exports.parseMidiCSV("clarinet,67,,,0,116");
  await exports.loadBuffer(ctx, note, cache);
  console.log(note.start);
  const brs = new audio_data_source_1.BufferSource(ctx, {
    start: exports.tickToTime(note.start),
    end: exports.tickToTime(note.start + note.duration),
    getBuffer: () => cache.read(`${note.instrument}${note.note}`),
  });
  console.log(brs._start);
  brs.connect(ctx);
  const pt = new stream_1.PassThrough();
  const wt = fs_1.createWriteStream("t1.wav");
  ctx.connect(wt);
  ctx.start();
  pt.on("data", (d) => {
    let offset = 0;
    while (offset * 2 < d.byteLength - 2) {
      const n = d.readInt16LE(offset);
      offset++;
      process.stdout.write(n + "\n");
    }
  });
  // while (offset * 2 < buffer.byteLength - 2) {
  // 	const n = buffer.readInt16LE(offset);
  // 	offset++;
  // 	process.stdout.write(n + ",");
  // }
}
// test();
//# sourceMappingURL=midi-buffer-source.js.map
