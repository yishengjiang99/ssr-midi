import { Midi, Header, Track } from "@tonejs/midi";
import { TempoEvent } from "@tonejs/midi/dist/Header";
import { spawn } from "child_process";

import { EventEmitter } from "events";
import { createWriteStream, readFileSync } from "fs";
import { Transform, TransformCallback } from "stream";
import { CombinedNotes, MidiNote } from ".";
import { BufferSource } from "./audio-data-source";
import { combineNotes } from "./combine-notes";
import { castInput, cspawnToBuffer } from "./ffmpeg-link";
import { ffplay } from "./ffplay";
import { SSRContext } from "./ssrctx";
import { Ticker } from "./ticker";
export function* midiTrackGenerator(
  tracks: Track[],
  header: Header
): Iterator<CombinedNotes[], CombinedNotes[], Error> {
  const stageNextNoteInTrack = (track: Track) => {
    const tmeasure = header.ticksToMeasures(ticker.ticks);
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

export const mixNoteTransform = (ctx: SSRContext, midiHeader: Header) =>
  new Transform({
    objectMode: true,
    transform: async (combinedNotes: CombinedNotes, _: BufferEncoding, cb: TransformCallback) => {
      if (!combinedNotes) {
        cb(null, null);
        return;
      }
      const startTime = midiHeader.ticksToSeconds(combinedNotes.start);
      const endTime = midiHeader.ticksToSeconds(combinedNotes.end);
      const timeDelta = endTime - startTime;
      const msPerTick = timeDelta / (combinedNotes.end - combinedNotes.start);
      const byteLength = ctx.bytesPerSecond * timeDelta;
      const inputClause = combinedNotes.midis
        .map((midi) => `-i db/Fatboy_${midi.instrument}/${midi.midi - 21}.mp3`)
        .join(" ");
      const delayFilters = [];
      const filterConnectors = [];
      for (const idx in combinedNotes.midis) {
        const midi = combinedNotes.midis[idx];
        const delay = midi.start - combinedNotes.start;
        const delayMs = msPerTick * delay;
        delayFilters.push(`[${idx}:a]adelay=${delayMs},apad=whole_len=${timeDelta}[d${idx}]`);
        filterConnectors.push(`[d${idx}]`);
      }
      const delayClause = delayFilters.join(",");
      const delayConnectorClause = filterConnectors.join("");

      const amix = `amix=inputs=${combinedNotes.midis.length}:duration=longest`;
      const loudnorm = `dynaudnorm`;
      const filterClause = `-filter_complex ${delayClause},${delayConnectorClause}${amix},${loudnorm}`;
      const settingClause = `-y -hide_banner -loglevel panic`;
      const aoptions = `-ac ${ctx.nChannels} -ar ${ctx.sampleRate}`;
      const format = ctx.format;
      const ob = Buffer.alloc(byteLength);
      await cspawnToBuffer(
        "ffmpeg",
        `${settingClause} ${inputClause} ${filterClause} ${aoptions} -t ${timeDelta} -f ${format} -`,
        ob
      );
      combinedNotes.buffer = ob;
      cb(null, combinedNotes);
    },
  });

const ctx = new SSRContext({ sampleRate: 9000, nChannels: 1, bitDepth: 32 });
const look_ahead_measures = 1;
const queue: CombinedNotes[] = [];
const filename = "Bohemian-Rhapsody-1.mid";

const { header, tracks } = new Midi(readFileSync(filename).buffer);
const ticker = new Ticker(header);
const scheduler = midiTrackGenerator(tracks, header);
const mixer: Transform = mixNoteTransform(ctx, header);
const ready = [];
const output = process.stdout;
mixer.once("readable", () => {
  mixer.pipe(ffplay(ctx));
});

ticker.on("tick", (_: number, _2: number) => {
  const { done, value } = scheduler.next();
  if (done) ctx.stop(0);
  value.forEach((v) => {
    queue.push(v);
  });

  if (queue[0]) {
    mixer.write(queue.shift());
  }
});
//console.log = (a, b, c) => {};
// ctx.start();
process.stdin.on("data", (d) => {
  //console.log(d.toString().trim());
  switch (d.toString().trim()) {
    case "a":
      ticker.stop();
      break;
    case "d":
      console.log("reume");
      ticker.resume();
      break;
    case "s":
      ticker.doTick();
      console.log("ticker:", ticker.tempo, ticker.bpm, ticker.msPerBeat, ticker.ticks);
      break;
  }
});

function donestream() {
  //cleanup here
  ctx.emit("finish");
}
