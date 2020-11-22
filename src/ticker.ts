import { Header } from "@tonejs/midi";
import { TempoEvent } from "@tonejs/midi/dist/Header";
import { EventEmitter } from "events";
export class Ticker extends EventEmitter {
  ticks: number = 0;
  ppq: number = 256; //ticks per beat
  bpm: number; //beats per minute
  timer: any;
  header: Header;
  tempo: TempoEvent;
  beatsPerMeasure: number;

  get msPerTick() {
    return 60000 / this.bpm / this.ppq;
  }
  get msPerBeat() {
    return 60000 / this.bpm;
  }
  get measure(): number {
    return this.header.ticksToMeasures(this.ticks);
  }
  constructor(header: Header) {
    super();
    this.header = header;
    this.ppq = header.ppq;
    this.tempo = header.tempos[0];
    this.bpm = this.header.tempos[0].bpm;

    this.beatsPerMeasure = (header.timeSignatures[0].timeSignature[1] * header.timeSignatures[0].timeSignature[2]) / 4;
  }

  doTick = () => {
    this.emit("tick", this.ticks, this.header.ticksToMeasures(this.ticks));
    this.ticks += this.ppq / 2;
    if (this.ticks > this.header.tempos[0].ticks) {
      this.header.tempos.shift()!;
      if (!this.header.tempos.length) {
        return;
      }
      this.bpm = this.header.tempos[0].bpm;
    }
    if (this.ticks > this.header.timeSignatures[0].ticks) {
      this.header.timeSignatures.shift()!;
      if (!this.header.timeSignatures.length) {
        return;
      }
      this.beatsPerMeasure = this.header.timeSignatures[0].timeSignature[1];
    }
  };
  resume = () => {
    let that = this;
    console.log(that.msPerBeat);
    const loop = () => {
      that.doTick();
      setTimeout(loop, that.msPerBeat / 2);
    };
    loop();
  };
  stop = () => {
    this.emit("stop");
    clearTimeout(this.timer);
  };
}
