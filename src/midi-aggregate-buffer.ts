import { TimeFrame } from "./";
import { Transform } from "stream";
import { AudioDataSource, BaseAudioSource, BufferSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";
export class AgggregateScheduledBuffer extends Transform {
  ctx: SSRContext;
  active: true;
  activeSources: Set<BufferSource>;
  upcoming: BufferSource[][];
  currentFrameBuffer: [TimeFrame, number, Buffer];

  constructor(ctx: SSRContext) {
    super({ objectMode: true });
    this.ctx = ctx;
    this.activeSources = new Set<BufferSource>();
    this.upcoming = new Array(210).fill([]);
    this.currentFrameBuffer = [ctx._frameNumber, 0, Buffer.alloc(ctx.blockSize)];
    this.ctx.on("tick", this.handleTick);
  }
  handleTick = (a, b) => {
    const newinputs = this.upcoming.shift();
    newinputs.forEach((sbr: BufferSource) => {
      this.activeSources.add(sbr);
      sbr.once("end", () => this.activeSources.delete(sbr));
    });
    this.upcoming.push([]);

    const l = this.ctx.blockSize;
    const g = 1 / this.activeSources.size;
    const sums = new this.ctx.sampleArray(l).fill(0);
    for (const sbr of this.activeSources) {
      if (!sbr.buffer && !sbr._getBuffer) {
        process.exit();
      }
      const b = sbr.pullFrame();
      for (let j in b) {
        sums[j] += b[j] * g;
      }
    }
  };
  get currentFrame(): [TimeFrame, number, Buffer] {
    return this.currentFrameBuffer;
  }
  set currentFrame(currentFrameBuffer: [TimeFrame, number, Buffer]) {
    this.currentFrame = currentFrameBuffer;
  }
  join(srb: BaseAudioSource) {
    const startFrame = srb._start / this.ctx.secondsPerFrame;
    console.log("new join", srb._start, "currentctx ", this.ctx.frameNumber);
    if (startFrame < this.ctx._frameNumber) {
      srb._start = this.ctx.currentTime;
      this.upcoming[0].push(srb);
    } else {
      this.upcoming[startFrame - this.ctx.frameNumber].push(srb);
      console.log(startFrame - this.ctx.frameNumber);
    }
  }
  _transform(chunks: BufferSource, _, cb) {
    [chunks].map((srb) => {
      if (!srb.buffer) cb(new Error("no buffer in aggre schedule transform " + srb.toString()));
      else {
        const startFrame = srb._start / this.ctx.secondsPerFrame;
        if (startFrame < this.ctx._frameNumber) {
          srb._start = this.ctx.currentTime;
          this.upcoming[0].push(srb);
        } else {
          this.upcoming[startFrame - this.ctx._frameNumber].push(srb);
        }
      }
    });
    cb();
  }

  pullFrame(): Buffer {
    return this.currentFrame[2];
  }
  _flush(cb) {
    // const activeInputs = Object.values(this.sources).filter((s) => s.active);
    // while (this.sources.length) {
    //   this.emit("data", this.pullFrame());
    // }
  }
}
