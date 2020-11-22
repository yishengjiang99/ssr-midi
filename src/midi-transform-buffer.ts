import { MidiNote } from ".";
import { Transform, TransformCallback } from "stream";
import { BufferSource } from "./audio-data-source";
import { CacheStore } from "./flat-cache-store";
import { loadBuffer } from "./midi-buffer-source";
import { SSRContext } from "./ssrctx";

export class MidiToScheduledBuffer extends Transform {
  noteCache: CacheStore;
  ctx: SSRContext;
  constructor(ctx: SSRContext) {
    super({ objectMode: true });
    this.ctx = ctx;
    this.noteCache = new CacheStore(100, ctx.bytesPerSecond * 2, ctx.format);
  }
  _transform = async (notes: MidiNote[], _: BufferEncoding, cb: TransformCallback) => {
    let that = this;
    for await (const brs of (async function* () {
      while (notes.length) {
        const note = notes.shift();
        note.buffer = await loadBuffer(that.ctx, note, that.noteCache);
        const srb = new BufferSource(that.ctx, { buffer: note.buffer, start: note.startTime, end: note.endTime });
        yield srb;
      }
    })());
    cb(null, notes);
  };
}
