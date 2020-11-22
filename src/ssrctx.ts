import { EventEmitter } from "events";
import { createWriteStream } from "fs";
import { Duplex, PassThrough, Readable, Writable } from "stream";
import { AudioDataSource, FileSource } from "./audio-data-source";
import { wavHeader, readHeader } from "./wav-header";

import { Decoder, Encoder } from "./kodak";
import { Ffmpegd } from "./ffmpegd";
type Time = [number, number];
export const timediff = (t1: Time, t2: Time) => {
  return t1[0] + t1[1] / 1e9 - (t2[0] + t2[1] / 1e9);
};
//#region
export interface CtxProps {
  nChannels?: number;
  sampleRate?: number;
  fps?: number;
  bitDepth?: number;
}
const defaultProps: CtxProps = {
  nChannels: 2,
  sampleRate: 44100,
  bitDepth: 16,
};
export class SSRContext extends Duplex {
  encoder: Encoder;
  nChannels: number;
  sampleRate: number;
  fps: number;
  lastFrame: Time;
  frameNumber: number;
  inputs: AudioDataSource[] = [];
  bitDepth: number;
  pt: PassThrough;
  endFrame: number;

  static fromFileName = (filename: string): SSRContext => {
    const nChannels = filename.match(/\-ac(\d+)\-/) ? parseInt(filename.match(/\-ac(\d+)\-/)[1]) : 2;
    const sampleRate = (filename.match(/\-ar(\d+)\-/) && parseInt(filename.match(/\-ar(\d+)\-/)[1])) || 44100;
    const bitDepth = filename.includes("f32le") ? 32 : 16;
    return new SSRContext({
      sampleRate: sampleRate,
      nChannels: nChannels,
      fps: sampleRate / 128 / 50,
      bitDepth,
    });
  };

  static default: SSRContext = new SSRContext(defaultProps);
  constructor(props: CtxProps = defaultProps) {
    super();
    const { nChannels, sampleRate, fps, bitDepth } = {
      ...{
        nChannels: 2,
        sampleRate: 44100,
        bitDepth: 16,
      },
      ...props,
    };
    this.nChannels = nChannels;
    this.sampleRate = sampleRate;
    this.fps = sampleRate / 128;
    this.frameNumber = 0;
    this.bitDepth = bitDepth;
    this.encoder = new Encoder(this.bitDepth);
  }
  get secondsPerFrame() {
    return 1 / this.fps;
  }
  get samplesPerFrame() {
    return (this.sampleRate * this.nChannels) / this.fps;
  }
  get inputSources() {
    return this.inputs.filter((i) => i.active);
  }
  get WAVHeader() {
    return wavHeader(30 * this.sampleRate, this.sampleRate, this.nChannels, this.bitDepth);
  }
  encode(buffer: Buffer, value: number, index: number): void {
    this.encoder.encode(buffer, value, index);
  }

  get sampleArray() {
    switch (this.bitDepth) {
      case 32:
        return Uint32Array;
      case 16:
        return Int16Array;
      case 8:
        return Uint8Array;
      default:
        return Int16Array;
    }
  }

  pump(): Buffer | null {
    this.frameNumber++;

    this.emit("tick");
    this.lastFrame = process.hrtime();
    if (!this.inputSources.length) return null;
    return this.inputSources[0].pullFrame();
  }
  prepareUpcoming() {
    let newInputs = [];
    const t = this.currentTime;
    for (let i = 0; i < this.inputs.length; i++) {
      if (this.inputs[i].readableEnded === false) {
        newInputs.push(this.inputs[i]);
      }
    }
    this.inputs = newInputs;
  }
  get blockSize() {
    return this.samplesPerFrame * this.sampleArray.BYTES_PER_ELEMENT;
  }
  get currentTime() {
    return this.frameNumber * this.secondsPerFrame;
  }
  get bytesPerSecond() {
    return this.sampleRate * this.nChannels * this.sampleArray.BYTES_PER_ELEMENT;
  }
  connect(destination: Writable) {
    this.pipe(destination);
  }
  start = () => {
    let that = this;
    this.emit("data", Buffer.from(this.WAVHeader));
    this.emit("readable");
    setInterval(() => {
      const buf = that.pump();
      if (buf) this.emit("data", buf);
      that.prepareUpcoming();
    }, this.secondsPerFrame);
  };
  get format() {
    return this.bitDepth === 16 ? "s16le" : "f32le";
  }
  stop(second: number = 0, cb?: CallableFunction) {
    if (!second) {
      this.end(cb);
    } else {
      setTimeout(() => {
        this.end(cb);
      }, second * 1000);
    }
  }
  _read(size: number) {
    this.cork();
    while (size > 0) {
      const output = this.pump();
      if (!output) break;
      this.push(this.pump());
      size -= this.blockSize;
    }
    this.uncork();
  }
}

// ctx.inputs.push(new FileSource(ctx, { filePath: "midi.wav" }));
// ctx.pipe(process.stdout);
// ctx.start();
