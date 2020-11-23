import { Track, Header, Midi } from "@tonejs/midi";
import { createWriteStream, readFile, readFileSync } from "fs";
import { MidiNote } from ".";
import { Readable, Writable } from "stream";
import { MidiToScheduledBuffer } from "./midi-transform-buffer";
import { SSRContext } from "./ssrctx";
import { Ticker } from "./ticker";
import { AgggregateScheduledBuffer } from "./midi-aggregate-buffer";

export async function* g24(
  ticker: Ticker,
  tracks: Track[],
  header: Header
): AsyncGenerator<MidiNote[], void, Error> {
  while (tracks.length) {
    let group = [];
    for (let i = 0; i < tracks.length; i++) {
      if (!tracks[i].notes.length) {
        tracks = tracks.splice(i, 1);
        continue;
      }
      while (tracks[i].notes[0].ticks <= ticker.measureInfo().endOfMeasure) {
        const note = tracks[i].notes.shift();
        if (!note) continue;
        const midinote: MidiNote = {
          instrument: tracks[i].instrument.name
            .replace(/\s/g, "_")
            .replace("(", "")
            .replace(")", ""),
          midi: note.midi,
          trackId: i,
          measure: header.ticksToMeasures(note.ticks),
          duration: (ticker.msPerTick * note.durationTicks) / 1000,
          start: note.ticks,
          end: note.ticks + note.durationTicks,
          startTime: header.ticksToSeconds(note.ticks),
          endTime: header.ticksToSeconds(note.ticks + note.durationTicks),
        };
        group.push(midinote);
      }
      if (group.length) {
        yield group;
      }
      await new Promise((resolve) => {
        ticker.once("measure", resolve);
      });
    }
  }
  return;
}

export async function playMidi(
  filename,
  sampleRate = 9000,
  nChannels = 1
): Promise<Readable> {
  try {
    const { tracks, header } = new Midi(readFileSync(filename));
    const ctx = SSRContext.default;
    ctx.sampleRate = sampleRate;
    ctx.nChannels = nChannels;
    const ticker = new Ticker(header);
    ticker.doTick();
    const g = g24(ticker, tracks, header);
    Readable.from(g)
      .pipe(new MidiToScheduledBuffer(ctx))
      .pipe(new AgggregateScheduledBuffer(ctx));
    return ctx;
  } catch (e) {
    console.error(e);
  }
}
playMidi("./samples/Beethoven-Moonlight-Sonata.mid", 8000, 1);
