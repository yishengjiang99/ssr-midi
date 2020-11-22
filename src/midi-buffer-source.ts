import { appendFileSync, createWriteStream, readFileSync, writeFile, writeFileSync } from "fs";
import { BufferSource } from "./audio-data-source";
import { cspawnToBuffer } from "./ffmpeg-link";
import { SSRContext } from "./ssrctx";
import { CacheStore } from "./flat-cache-store";
import { resolve, basename } from "path";
import { Midi } from "@tonejs/midi";
import { MidiNote } from ".";

/**
 * clarinet,67,0.28301699999999996,,256,116
 */

export const parseMidiCSV = (line: string): MidiNote => {
  const [instrument, note, duration, start, end] = line.split(",");
  return {
    instrument,
    midi: parseInt(note),
    duration: parseFloat(duration),
    startTime: parseFloat(start),
    endTime: parseFloat(end),
  };
};

export const loadBuffer = async (ctx: SSRContext, note: MidiNote, noteCache: CacheStore) => {
  try {
    const aoptions = `-ac ${ctx.nChannels} -ar ${ctx.sampleRate}`;
    const format = `${ctx.bitDepth === 16 ? "s16le" : "f32le"}`;
    const input = `db/Fatboy_${note.instrument}/${note.midi}.mp3`;
    const cacheKey = `${note.instrument}${note.midi}`;

    if (noteCache.cacheKeys.includes(cacheKey) && noteCache.read(cacheKey) !== null) {
      return noteCache.read(cacheKey);
    }
    const ob = Buffer.alloc(ctx.bytesPerSecond * note.duration);
    const cmd = `-hide_banner -loglevel panic -t ${note.duration} -i ${input} -f ${format} ${aoptions} pipe:1`;
    await cspawnToBuffer("ffmpeg", cmd, ob);
    return ob;
  } catch (e) {
    console.error(e);
  } finally {
  }
};

export const playCSVmidi = async (ctx: SSRContext, notes: MidiNote[], cacheFileName: string) => {
  const uniqs = new Set<string>();
  const uniqNotes = notes.map((n) => uniqs.add(n.instrument + n.midi));
  const noteCache = new CacheStore(uniqNotes.length, ctx.bytesPerSecond * 2, cacheFileName);

  for await (const brs of (async function* () {
    while (notes.length) {
      const note = notes.shift();
      await loadBuffer(ctx, note, noteCache);
      const brs = new BufferSource(ctx, {
        start: note.start - 40,
        end: note.end - 40,
        getBuffer: () => noteCache.read(`${note.instrument}${note.midi}`),
      });
      brs.connect(ctx);
      yield brs;
    }
  })());
  noteCache.persist();
};

export const writeToCsv = (filename) => {
  const wfs = resolve(__dirname, "../csv/", basename(filename) + ".csv");

  const { header, tracks } = new Midi(readFileSync(resolve(__dirname, filename)).buffer);
  writeFileSync(wfs, header.name);
  appendFileSync(wfs, "\n#inst,midi,duration,statt,end");
  tracks.map((t) => {
    t.notes.map((note) => {
      const obj = {
        instrument: t.instrument.name
          .replace(" ", "_")
          .replace(" ", "_")
          .replace(" ", "_")
          .replace("(", "")
          .replace(")", ""),
        note: note.midi,
        duration: header.ticksToSeconds(note.durationTicks),
        start: header.ticksToSeconds(note.ticks),
        end: header.ticksToSeconds(note.ticks) + header.ticksToSeconds(note.durationTicks),
      };
      appendFileSync(wfs, "\n" + Object.values(obj).join(","));
      console.log(obj);
    });
  });
  return filename + ".csv";
};

export async function playCsv(ctx: SSRContext, csv: string, outfile: string) {
  const uniqNotes = parseInt(
    require("child_process").execSync(`cat ${csv} |cut -f1,2 -d',' |sort|uniq|wc -l`).toString().trim()
  );
  const noteCache = new CacheStore(uniqNotes, ctx.bytesPerSecond * 2, resolve(`db/cache/${basename(csv)}`));
  let notes = readFileSync(csv)
    .toString()
    .trim()
    .split("\n")
    .map((line) => parseMidiCSV(line));

  for await (const brs of (async function* () {
    while (notes.length && notes[0].startTime - ctx.currentTime < 4) {
      const note = notes.shift();
      const brs = new BufferSource(ctx, {
        start: note.start,
        end: note.end,
        getBuffer: () => noteCache.read(`${note.instrument}${note.midi}`),
      });
      await loadBuffer(ctx, note, noteCache);
      yield brs;
    }
  })()) {
    ctx.inputs.push(brs);
    if (notes[0].startTime - ctx.currentTime > 4)
      await new Promise((resolve) => {
        ctx.once("tick", resolve);
      });
  }
  noteCache.persist();
  const fs = createWriteStream(outfile);
  ctx.connect(fs);
  ctx.prepareUpcoming();
  ctx.on("data", (d) => {
    console.log(".");
    fs.write(d);
  });
  ctx.emit("data", Buffer.from(ctx.WAVHeader));
  ctx.on("tick", () => {
    console.log(ctx.currentTime);
  });
  ctx.start();
  return ctx;
}
//writeToCsv("../Beethoven-Symphony5-1.mid");
//playCsv(SSRContext.default, "piano.csv", "piano.wav");
