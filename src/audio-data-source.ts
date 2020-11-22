import { SSRContext } from "./ssrctx";
import { openSync, readSync, read, createReadStream, closeSync, stat, statSync } from "fs";
import { Readable } from "stream";
import { EventEmitter } from "events";
import { start } from "repl";

export interface AudioDataSource extends Readable {
  ctx: SSRContext;
  active: boolean;
  pullFrame: () => Buffer;
  connect?: (destination: SSRContext) => boolean;
  prepare?: (currentTime: number) => void;
}
export class BaseAudioSource extends Readable implements AudioDataSource {
  constructor(ctx: SSRContext) {
    super();
    this.ctx = ctx;
  }
  ctx: SSRContext;
  get active() {
    return true;
  }
  pullFrame() {
    return Buffer.alloc(this.ctx.blockSize).fill(0);
  }
  connect(dest: SSRContext) {
    dest.inputs.push(this);
    return true;
  }
  _read() {
    this.pullFrame();
  }
}

export class Oscillator extends Readable implements AudioDataSource {
  ctx: SSRContext;
  frequency: any;
  active: boolean = true;
  bytesPerSample: number;
  _ended: boolean = false;
  constructor(
    ctx: SSRContext,
    {
      frequency,
    }: {
      frequency: number;
    }
  ) {
    super();
    this.ctx = ctx;
    this.frequency = frequency;
    this.bytesPerSample = this.ctx.sampleArray.BYTES_PER_ELEMENT;
    this.connect(ctx);
  }
  get header(): Buffer {
    return Buffer.from(this.ctx.WAVHeader);
  }
  _read(size: number) {
    while (size > 0) {
      this.pullFrame();
      size -= this.ctx.blockSize;
    }
  }
  pullFrame(): Buffer {
    if (!this.active) return Buffer.alloc(0);
    const frames = Buffer.allocUnsafe(this.ctx.blockSize);
    const n = this.ctx.frameNumber;
    const cyclePerSample = (3.14 * 2 * this.frequency) / this.ctx.sampleRate;
    const cyclePerFrame = (3.14 * 2 * this.frequency) / this.ctx.fps;
    const phase = this.ctx.frameNumber * cyclePerFrame;
    for (let i = 0; i < this.ctx.samplesPerFrame; i++) {
      const idx = ~~(i / this.ctx.nChannels);
      this.ctx.encode(frames, Math.sin(phase + cyclePerSample * idx), i);
    }
    this.emit("data", frames);
    return frames;
  }
  start() {
    this.active = true;
  }
  stop() {
    this._ended = true;
    this.active = false;
  }
  connect(dest: SSRContext) {
    dest.inputs.push(this);
    return true;
  }
  ended() {
    return this._ended;
  }
}

export class FileSource extends BaseAudioSource {
  offset: number;
  fd: number;
  ctx: SSRContext;
  output: Buffer;
  wptr: number;
  _ended: boolean = false;
  size: number;

  constructor(
    ctx: SSRContext,
    {
      filePath,
    }: {
      filePath: string;
    }
  ) {
    super(ctx);
    this.fd = openSync(filePath, "r");
    this.size = statSync(filePath).size;
    this.ctx = ctx;
    this.offset = 0;
  }
  connect(dest: SSRContext) {
    dest.inputs.push(this);
    return true;
  }
  _read() {
    this.pullFrame();
  }
  pullFrame(): Buffer {
    const ob = Buffer.allocUnsafe(this.ctx.blockSize);
    readSync(this.fd, ob, 0, ob.byteLength, this.offset);
    this.offset += ob.byteLength;
    if (this.offset > this.size) {
      this.emit("end");
    }
    this.emit("data", ob);
    return ob;
  }
  stop() {
    closeSync(this.fd);
  }
}

export type BufferSourceProps = {
  buffer?: Buffer;
  getBuffer?: () => Buffer;
  start: number;
  end: number;
};

export class BufferSource extends BaseAudioSource {
  _start: number;
  _end: number;
  _getBuffer: () => Buffer;
  ctx: SSRContext;
  buffer: Buffer;

  constructor(ctx: SSRContext, props: BufferSourceProps) {
    super(ctx);
    this.ctx = ctx;
    this.buffer = props.buffer;
    const { getBuffer, start, end } = props;
    this._start = start;
    this._end = end;
    this._getBuffer = getBuffer;
  }

  get active(): boolean {
    return this.ctx.currentTime >= this._start;
  }

  pullFrame(): Buffer {
    if (!this.buffer && this._getBuffer) this.buffer = this._getBuffer();

    const ret = this.buffer.slice(0, this.ctx.blockSize);
    this.buffer = this.buffer.slice(this.ctx.blockSize);
    if (this.buffer.byteLength === 0) {
      this.destroy();
      return this.buffer;
    }
  }
}
