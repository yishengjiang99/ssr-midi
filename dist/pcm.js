"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ffplayPCM = exports.combined_midi_s16le_ac1_ar_9000_proc = exports.midi_s16le_ac1_ar_9000 = exports.midi_sample_mp3 = exports.bytesPCMPerNote = exports.bytesPerNote = void 0;
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const flat_cache_store_1 = require("./flat-cache-store");
const ffmpeg_link_1 = require("./ffmpeg-link");
exports.bytesPerNote = 887832 / 88;
exports.bytesPCMPerNote = 38452;
const cache = flat_cache_store_1.cacheStore(200, exports.bytesPerNote);
const pcmCache = flat_cache_store_1.cacheStore(200, exports.bytesPCMPerNote);
exports.midi_sample_mp3 = (instrument, midi) => {
    const cacheKey = instrument + midi;
    let cachedValue = cache.read(cacheKey);
    console.log("cachedvalue", cachedValue);
    if (cachedValue)
        return cachedValue;
    console.log(cache.cacheKeys);
    const fd = fs_1.openSync(`./mp3/Fatboy_${instrument.replace(" ", "_")}/${midi + 21}.mp3`, "r");
    const segment = cache.malloc(cacheKey);
    fs_1.readSync(fd, segment);
    fs_1.closeSync(fd);
    return segment;
};
exports.midi_s16le_ac1_ar_9000 = async (instrument, midi) => {
    const cacheKey = instrument + midi;
    let cachedValue = pcmCache.read(cacheKey);
    if (cachedValue)
        return cachedValue;
    const infile = `./mp3/Fatboy_${instrument.replace(" ", "_")}/${midi - 21}.mp3`;
    const buf = pcmCache.malloc(10000);
    await ffmpeg_link_1.cspawnToBuffer(`ffmpeg`, `-i ${infile} -f s16le -ac 1 -ar 9000`, buf);
    pcmCache.set(cacheKey, buf);
    return buf;
};
exports.combined_midi_s16le_ac1_ar_9000_proc = (notes, attributes) => {
    const cacheKey = notes
        .map(([midi, instrument]) => midi + instrument)
        .join("-");
    // let cachedValue = pcmCache.read(cacheKey);
    // if(cachedValue) return cachedValue;
    const cmdargs = `${notes.reduce((args, [midi, instrument]) => {
        return args + ` -i ./mp3/Fatboy_${instrument}/${midi - 21}.mp3`;
    }, "")} -filter_complex amix=inputs=${notes.length} -ac 1 -ar 9000 -f s16le -`.split(" ");
    return child_process_1.spawn("ffmpeg", cmdargs);
};
exports.ffplayPCM = (format = " -f s16le -ac 1 -ar 9000 ") => {
    return child_process_1.spawn("ffplay", `-i pipe:0 ${format}`.split(" "));
};
exports.combined_midi_s16le_ac1_ar_9000_proc([
    [67, "clarinet"],
    [67, "string_ensemble_1"],
    [67, "string_ensemble_1"],
    [55, "string_ensemble_1"],
    [43, "string_ensemble_1"],
    [43, "string_ensemble_1"],
], { "-t": 0.22 });
//# sourceMappingURL=pcm.js.map