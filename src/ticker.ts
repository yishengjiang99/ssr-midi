import { Header, Midi } from "@tonejs/midi";
import { TempoEvent, TimeSignatureEvent } from "@tonejs/midi/dist/Header";
import { EventEmitter } from "events";
import e from "express";
import { readFileSync } from "fs";
import { parentPort } from "worker_threads";
const { MessageChannel, markAsUntransferable, Worker, isMainThread } = require("worker_threads");
const { port1, port2 } = new MessageChannel();

export class Ticker extends EventEmitter {
  ticks: number = 0;
  ppq: number = 256; //ticks per beat
  timer: any;
  header: Header;
  tempo: TempoEvent;
  timeSignature: number[];
  andTwoThreeFour: number = 0; //the n-th[1..4] quarter/eighth note of a measure
  measure: number = 0;
  get ticksPerBeat() {
    return (this.ppq * 4) / this.timeSignature[1]; // this.timeSignature[1];
  }
  get beatsPerMeasure() {
    return this.timeSignature[0];
  }
  get quarterNotesPerMeasure() {
    return (this.timeSignature[0] / this.timeSignature[1]) * 4;
  }
  get bpm() {
    return this.tempo.bpm;
  }
  get msPerTick() {
    // 60s / 120beats / quarterNotesPerBeat * ticks perquater note
    return 60000 / this.bpm / this.ticksPerBeat;
  }
  get msPerBeat() {
    return 60000 / this.bpm;
  }

  constructor(header: Header) {
    super();
    this.header = header;
    this.ppq = header.ppq;
    this.tempo = this.header.tempos.shift();
    this.timeSignature = this.header.timeSignatures.shift().timeSignature;
    this.andTwoThreeFour = 0;
  }
  updateMetaIfNeeded() {
    let updates = 0x0;
    if (this.header.tempos[0] && this.ticks >= this.header.tempos[0].ticks) {
      this.tempo = this.header.tempos.shift();
    }
    if (this.header.timeSignatures[0] && this.ticks >= this.header.timeSignatures[0].ticks) {
      this.timeSignature = this.header.timeSignatures.shift().timeSignature;
      this.andTwoThreeFour = 0;
    }
  }
  measureInfo() {
    return {
      ticks: this.ticks,
      measure: this.measure,
      bpm: this.bpm,
      endOfMeasure: this.ticks + this.ticksPerBeat / this.beatsPerMeasure,
      nthsBeatOfMeasure: this.andTwoThreeFour,
      timeSignature: this.timeSignature,
    };
  }

  doTick = () => {
    this.ticks = this.ticks + this.ticksPerBeat;
    if (this.andTwoThreeFour % this.beatsPerMeasure == 0) {
      this.emit("measure", this.measureInfo());
    }
    this.andTwoThreeFour++;

    this.updateMetaIfNeeded();
    this.emit("beat", this.ticks, this.andTwoThreeFour);

    this.timer = setTimeout(this.doTick, this.msPerBeat);
  };
  resume = () => {
    this.updateMetaIfNeeded();
  };
  stop = () => {
    this.emit("stop");
    clearTimeout(this.timer);
  };
}
const mid = new Midi(readFileSync("song.mid"));
const ticker = new Ticker(mid.header);
if (isMainThread) {
  // This re-loads the current file inside a Worker instance.
  const worker = new Worker(__filename);
  setInterval(() => {
    worker.postMessage("hi");
    console.log(worker.performance.eventLoopUtilization());
  }, 100).unref();
  const ryan = new EventEmitter();
  worker.postMessage("start");
  worker.on("message", (e) => {
    console.log(e);
    ryan.emit("tick");
  });
} else {
  ticker.on("beat", (data) => {
    parentPort.postMessage({ beat: data });
  });
  ticker.on("measure", (info) => {
    parentPort.postMessage({ measure: info });
  });
  parentPort.on("message", () => {
    ticker.doTick();
  });
}
