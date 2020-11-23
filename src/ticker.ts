import { Header } from "@tonejs/midi";
import { TempoEvent, TimeSignatureEvent } from "@tonejs/midi/dist/Header";
import { EventEmitter } from "events";
import { json } from "express";
export class Ticker extends EventEmitter {
  ticks: number = 0;
  ppq: number = 256; //ticks per beat
  timer: any;
  header: Header;
  tempo: TempoEvent;
  timeSignature: TimeSignatureEvent;
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
  }
  updateMetaIfNeeded() {
    let updates = 0x0;
    if (!this.tempo || this.ticks >= this.header.tempos[0].ticks) {
      this.tempo = this.header.tempos.shift();
    }
    if (!this.timeSignature || this.timeSignature.ticks >= this.header.timeSignatures[0].ticks) {
      this.timeSignature = this.header.timeSignatures.shift();
      this.andTwoThreeFour = 0;
      updates |= 0x2;
    }
  }
  measureInfo() {
    return {
      ticks: this.ticks,
      measure: ++this.measure,
      endOfMeasure: this.ticks + this.ticksPerBeat / this.beatsPerMeasure,
      //60s / 120beats / quarterNotesPerBeat * ticks
      nthsBeatOfMeasure: this.andTwoThreeFour,
      ticksRemainingCurrentMeasure: (this.beatsPerMeasure - this.andTwoThreeFour) * this.ticksPerBeat,
    };
  }

  doTick = () => {
    this.ticks = this.ticks + this.ticksPerBeat;
    this.andTwoThreeFour++; //* this.this.emit("tick", this.ticks, this.beatsOfMeasure);
    this.updateMetaIfNeeded();
    this.emit("beat", this.ticks, this.andTwoThreeFour);
    if (this.andTwoThreeFour == 0) {
      this.emit("measure", this.measureInfo);
    }
    setTimeout(this.doTick, this.msPerBeat);
  };
  resume = () => {
    this.updateMetaIfNeeded();
  };
  stop = () => {
    this.emit("stop");
    clearTimeout(this.timer);
  };
}
