"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_1 = require("fs");
const audio_data_source_1 = require("./audio-data-source");
const midi_buffer_source_1 = require("./midi-buffer-source");
const ssrctx_1 = require("./ssrctx");
describe("midi-buffersource", () => {
    const ctx = new ssrctx_1.SSRContext({
        nChannels: 1,
        bitDepth: 16,
        sampleRate: 9000,
    });
    it("it loads buffer from file", async () => {
        const cache = midi_buffer_source_1.initCache(ctx);
        const buffer = await midi_buffer_source_1.loadBuffer(ctx, midi_buffer_source_1.parseMidiCSV("clarinet,67,0.28301699999999996,,256,116"), cache);
        const buffer2 = await midi_buffer_source_1.loadBuffer(ctx, midi_buffer_source_1.parseMidiCSV("clarinet,67,0.28301699999999996,,256,116"), cache);
        chai_1.expect(cache.length).to.equal(1);
        ctx.stop(0);
    });
    it("makes BufferSource", async () => {
        const cache = midi_buffer_source_1.initCache(ctx);
        const note = midi_buffer_source_1.parseMidiCSV("clarinet,67,,,0,116");
        await midi_buffer_source_1.loadBuffer(ctx, note, cache);
        const brs = new audio_data_source_1.BufferSource(ctx, {
            start: midi_buffer_source_1.tickToTime(note.start),
            end: midi_buffer_source_1.tickToTime(note.start + note.duration),
            getBuffer: () => cache.read(`${note.instrument}${note.note}`),
        });
        let offset = 0;
        const buffer = brs.pullFrame();
        buffer.readInt16LE(offset);
        while (offset < ctx.blockSize) {
            const n = buffer.readInt16LE(offset);
            offset += 2;
        }
    });
    it("add as a track to ssr context", (done) => {
        let line = `clarinet,67,0.14150849999999998,,0,116`;
        const note = midi_buffer_source_1.parseMidiCSV(line);
        const ctx = new ssrctx_1.SSRContext({
            nChannels: 1,
            bitDepth: 16,
            sampleRate: 9000,
        });
        const cache = midi_buffer_source_1.initCache(ctx);
        midi_buffer_source_1.loadBuffer(ctx, note, cache).then((buffer) => {
            new audio_data_source_1.BufferSource(ctx, {
                start: midi_buffer_source_1.tickToTime(note.start),
                end: midi_buffer_source_1.tickToTime(note.start + note.duration),
                buffer: buffer,
            });
            const output = fs_1.createWriteStream("outputfile.wav");
            output.write(new Uint8Array(ctx.WAVHeader));
            ctx.connect(output);
            ctx.start();
            setTimeout(() => {
                // execSync("ffplay -i outputfile.wav");
                ctx.stop(0);
                done();
            }, 400);
        });
    }).timeout(2000);
    it("loads csv file", (done) => {
        const ctx = new ssrctx_1.SSRContext({
            nChannels: 1,
            bitDepth: 16,
            sampleRate: 9000,
        });
        midi_buffer_source_1.playCsv("f32le-ar9000-ac1-", "clarinet-midi.csv", "clarinet.wav");
    }).timeout(2000);
});
//# sourceMappingURL=midi-buffer-source.test.js.map