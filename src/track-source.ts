import { ScheduledDataSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";

import { createWriteStream, readFileSync } from "fs";
import { Readable, Writable } from "stream";
import { CacheStore } from "./flat-cache-store";
import { MidiNote } from "./midi-buffer-source";

export class MidiTrackSource extends Readable implements ScheduledDataSource {
  schedule: MidiNote[];
  _getBuffer: () => Buffer;
  ctx: SSRContext;
  cache: CacheStore;
  preload: (ctx: SSRContext, sched: MidiNote, cache: CacheStore) => Promise<Buffer>;

  constructor(ctx: SSRContext, { preload, cache, sched }) {
    super();
    this.ctx = ctx;
    this.schedule = sched;
    this.cache = cache;
    this.preload = preload;
  }
  start: (when?: number) => void;
  stop: (when?: number) => {};
  async prepare(currentTime: number) {
    let sched = this.schedule,
      ctx = this.ctx,
      cache = this.cache,
      prepload = this.preload,
      i = 0;
    for await (const n of (async function* () {
      while (sched[i] && sched[i].start - currentTime < 5) {
        sched[i].buffer = await prepload(ctx, sched[i], cache);
        i++;
      }
    })()) {
      // this.buffer = buffer;
    }
  }

  get active(): boolean {
    return (
      !this.ended() &&
      this.schedule[0].start >= this.ctx.currentTime &&
      this.schedule[0].end <= this.ctx.currentTime &&
      this.schedule[0].buffer.byteLength != 0
    );
  }
  pullFrame(): Buffer {
    if (this.schedule[0].start <= this.ctx.currentTime && this.schedule[0].end >= this.ctx.currentTime) {
      if (!this.schedule[0].buffer) {
        throw new Error("no bufer for " + this.schedule[0]);
      }
      const ob = this.schedule[0].buffer.slice(0, this.ctx.blockSize);
      this.schedule[0].buffer.slice(this.ctx.blockSize);
      return ob;
    } else if (this.schedule[0].end <= this.ctx.currentTime) {
      this.schedule.shift();
    }
    return null;
  }
  connect(dest: SSRContext) {
    dest.inputs.push(this);
    return true;
  }
  ended() {
    return this.schedule.length === 0;
  }
  dealloc() {}
}
