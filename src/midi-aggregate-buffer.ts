import { MidiNote } from "./";
import { Transform } from "stream";
import { BufferSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";

export class AgggregateScheduledBuffer extends Transform {
  ctx: SSRContext;
  sources: { [key: string]: BufferSource };
  id: number = 0;
  active: true;
  constructor(ctx: SSRContext) {
    super({ objectMode: true });

    this.ctx = ctx;
    this.ctx.inputs.push(this);
  }

  _transform(chunks: BufferSource[], _, cb) {
    chunks.map((srb) => {
      if (!srb.buffer) cb(new Error("no buffer in aggre schedule transform " + srb.toString()));
      else {
        const id = this.id;
        this.sources[id] = srb;
        srb.on("end", () => delete this.sources[id]);
      }
    });
    cb();
  }
  pullFrame() {
    const l = this.ctx.blockSize;
    const sums = new this.ctx.sampleArray(l).fill(0);
    const n = this.ctx.blockSize;
    const activeInputs = Object.values(this.sources).filter((s) => s.active);
    for (let i = 0; i < activeInputs.length; i++) {
      const b = activeInputs[i].pullFrame();
      for (let j in b) {
        sums[j] += b[j] / activeInputs.length;
      }
    }
    this.emit("data", sums);
    return Buffer.from(sums);
  }
}
