import { Track, Header, Midi } from "@tonejs/midi";
import { createWriteStream, readFile, readFileSync } from "fs";
import { MidiNote } from ".";
import { Readable, Writable } from "stream";
import { Ticker } from "./ticker";
import { MidiToScheduledBuffer } from "./midi-transform-buffer";
import { SSRContext } from "./ssrctx";
import { AgggregateScheduledBuffer } from "./midi-aggregate-buffer";
import { ffplay } from "./ffplay";
import { resolve } from "path";

export async function* midiTrackGenerator2(
  ctx: SSRContext,
  tracks: Track[],
  header: Header
): AsyncGenerator<MidiNote[], void, Error> {
  const stageNextNoteInTrack = (track: Track) => {
    const startTme = header.ticksToSeconds(track.notes[0].ticks);
    return startTme - ctx.currentTime;
  };

  while (tracks.length) {
    const staging = [];
    let minsleep = 11110;
    for (let i = 0; i < tracks.length; i++) {
      if (!tracks[i].notes.length) {
        tracks = tracks.splice(i, 1);
        continue;
      }
      const nextNote = stageNextNoteInTrack(tracks[i]);
      if (nextNote < 3) {
        const note = tracks[i].notes.shift();
        if (!note) continue;
        const midinote: MidiNote = {
          instrument: tracks[i].instrument.name.replace(/\s/g, "_").replace("(", "").replace(")", ""),
          midi: note.midi,
          trackId: i,
          measure: header.ticksToMeasures(note.ticks),
          duration: header.ticksToSeconds(note.durationTicks),
          start: note.ticks,
          end: note.ticks + note.durationTicks,
          startTime: header.ticksToSeconds(note.ticks),
          endTime: header.ticksToSeconds(note.ticks + note.durationTicks),
        };
        staging.push(midinote);
      } else {
        minsleep = Math.min(minsleep, nextNote);
      }
    }
    if (staging.length) yield staging;
    else {
      await new Promise((r) => setTimeout(r, minsleep * 1000));
    }
  }

  return;
}

export const scheduledMidiTracks = (midifile: string, ctx: SSRContext): Readable => {
  const midi = new Midi(readFileSync(midifile));
  const ticker = new Ticker(midi.header);
  const midiSource = midiTrackGenerator2(ctx, midi.tracks, midi.header);
  const rs = new Readable({
    read: async () => {
      const { done, value } = await midiSource.next();
      if (done) rs.emit("end");
      if (value) {
        rs.emit("data", value);
      }
    },
  });
  ctx.on("tick", async () => {
    const { done, value } = await midiSource.next();
    if (done) rs.emit("end");
    if (value) {
      rs.emit("data", value);
    }
  });
  return rs;
};

export async function playMidi(ctx: SSRContext, midifile: string, output: Writable) {
  scheduledMidiTracks(midifile, ctx).pipe(new MidiToScheduledBuffer(ctx)).pipe(new AgggregateScheduledBuffer(ctx));

  ctx.connect(output);
  ctx.start();
}
const ctx = SSRContext.default;
// ctx.start();

// playMidi(ctx, resolve(__dirname, "..", "song.mid"), createWriteStream("gg.wav"));
const midi = new Midi(readFileSync("song.mid"));

const midiSource = midiTrackGenerator2(ctx, midi.tracks, midi.header);
(async function () {
  console.log((await midiSource.next()).value);
  console.log((await midiSource.next()).value);

  console.log((await midiSource.next()).value);
})();
