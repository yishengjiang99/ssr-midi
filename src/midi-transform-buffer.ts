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
    this.noteCache = new CacheStore(200, ctx.bytesPerSecond * 3, ctx.format);
  }
  _transform = async (note: MidiNote, _: BufferEncoding, cb: TransformCallback) => {
    note.buffer = await loadBuffer(this.ctx, note, this.noteCache);
    const srb = new BufferSource(this.ctx, { buffer: note.buffer, start: note.startTime, end: note.endTime });
    this.emit("data", srb);
    cb(null, null);
  };
  _flush = (cb) => {
    this.noteCache.persist();
    cb(null, null);
  };
}
