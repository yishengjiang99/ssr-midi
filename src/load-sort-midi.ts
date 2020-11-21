import { Midi, Header, Track } from "@tonejs/midi";
import { TempoEvent } from "@tonejs/midi/dist/Header";

import { EventEmitter } from "events";
import { readFileSync } from "fs";
import { Transform, TransformCallback } from "stream";
import { CombinedNotes, MidiNote } from ".";
import { combineNotes } from "./combine-notes";
import { cspawnToBuffer } from "./ffmpeg-link";
import { SSRContext } from "./ssrctx";

class Ticker extends EventEmitter {
  tick: number = 0;
  ppq: number = 120;
  timer: any;
  header: Header;
  tempo: TempoEvent;
  constructor(header: Header) {
    super();
    this.header = header;
    this.ppq = header.ppq;
    this.tempo = header.tempos.shift()!;
  }
  get bpm() {
    return this.tempo.bpm;
  }
  doTick = () => {
    this.tick += this.ppq / 2;
    this.emit("tick", this.tick, this.header.ticksToMeasures(this.tick));
    if (this.tick > this.header.tempos[0].ticks) {
      //tempoo change
      this.tempo = this.header.tempos.shift()!;
    }
  };
  resume = () => {
    let t = this.doTick;
    this.timer = setInterval(t, 60000 / this.bpm / 2);
  };
  stop = () => {
    this.emit("stop");
    clearTimeout(this.timer);
  };
  step = () => {
    this.emit("tick", this.tick, this.header.ticksToMeasures(this.tick));
  };
}

export function* midiTrackGenerator(
  tracks: Track[],
  header: Header
): Iterator<CombinedNotes[], CombinedNotes[], Error> {
  const stageNextNoteInTrack = (track: Track) => {
    const tmeasure = header.ticksToMeasures(ticker.tick);
    const noteMeasure = header.ticksToMeasures(track.notes[0].ticks);
    return Math.floor(noteMeasure) - tmeasure <= look_ahead_measures;
  };

  while (tracks.length) {
    const staging = [];
    for (let i = 0; i < tracks.length; i++) {
      if (!tracks[i].notes.length) {
        tracks = tracks.splice(i, 1);
        continue;
      }
      if (stageNextNoteInTrack(tracks[i])) {
        const note = tracks[i].notes.shift();
        if (!note) continue;

        const midinote: MidiNote = {
          instrument: tracks[i].instrument.name.replace(/\s/g, "_").replace("(", "").replace(")", ""),
          midi: note.midi,
          measure: header.ticksToMeasures(note.ticks),
          duration: note.durationTicks,
          start: note.ticks,
          end: note.ticks + note.durationTicks,
        };
        staging.push(midinote);
      }
    }
    yield combineNotes(staging);
  }
  donestream();
  return [];
}
export const mixNoteTransform = () =>
  new Transform({
    objectMode: true,
    transform: async (combinedNotes: CombinedNotes, _: BufferEncoding, cb: TransformCallback) => {
      if (!combinedNotes) {
        cb(null, null);
        return;
      }
      console.log(combinedNotes.start, combinedNotes.end);
      const inputClause = combinedNotes.midis
        .map((midi) => `-i db/Fatboy_${midi.instrument}/${midi.midi - 21}.mp3`)
        .join(" ");
      const byteLength = ((combinedNotes.end - combinedNotes.start) / 1000) * ctx.bytesPerSecond;
      const dtags = [];
      const delayClause = combinedNotes.midis
        .filter((m) => m.start != combinedNotes.start)
        .map((midi) => midi.start - combinedNotes.start)
        .map((delay, index) => {
          dtags.push(`[d${index}]`);

          return `[${index}:a]adelay=${delay},apad=whole_len=${byteLength}[d${index}]`;
        })
        .join(",");

      const amix = `amix=inputs=${combinedNotes.midis.length}:dropout_transition=0`;
      const loudnorm = `dynaudnorm`;
      const filterClause = `-filter_complex ${delayClause},${dtags.join("")}${amix},${loudnorm}`;
      const settingClause = `-y -hide_banner -loglevel debug`;
      const aoptions = `-ac ${ctx.nChannels} -ar ${ctx.sampleRate}`;
      const format = `mp3`;
      process.stdout.write(`${settingClause} ${inputClause} ${filterClause} ${aoptions} -f ${format} -`);
      const ob = Buffer.alloc(length);
      await cspawnToBuffer("ffmpeg", `${settingClause} ${inputClause} ${filterClause} ${aoptions} -f ${format} -`, ob);
      combinedNotes.buffer = ob;
      cb(null, combineNotes);
    },
  });

const ctx = new SSRContext(SSRContext.defaultProps);
const look_ahead_measures = 2;
const queue: CombinedNotes[] = [];
const filename = "song.mid";
const { header, tracks } = new Midi(readFileSync(filename).buffer);
const ticker = new Ticker(header);
console.log(header.toJSON());
const scheduler = midiTrackGenerator(tracks, header);
const mixer: Transform = mixNoteTransform();

ticker.on("tick", (tick: number, measure: number) => {
  console.log(tick);
  const { done, value } = scheduler.next();
  if (done) ctx.stop(0);
  value.forEach((v) => {
    queue.push(v);
  });

  if (queue[0] && queue[0].measure - measure <= 3) {
    console.log(queue.shift());

    mixer.write(queue.shift());
  }
});

process.stdin.on("data", (d) => {
  console.log(d.toString().trim());
  switch (d.toString().trim()) {
    case "a":
      ticker.stop();
      break;
    case "d":
      ticker.resume();
      break;
    case "s":
      ticker.step();
      break;
  }
});

function donestream() {
  //cleanup here
  ctx.emit("finish");
}
