import { Track, Header, Midi } from "@tonejs/midi";
import { createWriteStream, readFile, readFileSync } from "fs";
import { MidiNote } from ".";
import { Readable, Writable } from "stream";
import { MidiToScheduledBuffer } from "./midi-transform-buffer";
import { SSRContext } from "./ssrctx";

export async function* g24(ctx: SSRContext, tracks: Track[], header: Header): AsyncGenerator<MidiNote[], void, Error> {
  while (tracks.length) {
    for (let i = 0; i < tracks.length; i++) {
      if (!tracks[i].notes.length) {
        // tracks = tracks.splice(i, 1);
        continue;
      }
      if (header.ticksToSeconds(tracks[i].notes[0].ticks) - ctx.currentTime < 50) {
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
        console.log(midinote.startTime, "vs", ctx.currentTime);
        yield [midinote];
      }
      await new Promise((resolve) => {
        // ctx.removeAllListeners("tick");
        ctx.once("tick", resolve);
        console.log(ctx.listeners("tick"));
      });
    }
  }
  return;
}

export async function playMidi(filename, output, sampleRate = 9000, nChannels = 1): Promise<Readable> {
  try {
    const { tracks, header } = new Midi(readFileSync(filename));
    const ctx = SSRContext.default;
    ctx.sampleRate = sampleRate;
    ctx.nChannels = nChannels;
    const g = g24(ctx, tracks, header);
    Readable.from(g).pipe(new MidiToScheduledBuffer(ctx)).pipe(ctx.aggregate);
    // ctx.pipe(createWriteStream("333.wav"));
    ctx.start();
    return ctx;
  } catch (e) {
    console.error(e);
  }
}
playMidi("./samples/Beethoven-Moonlight-Sonata.mid", 8000, 1);
