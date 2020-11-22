import { Midi } from "@tonejs/midi";
import { expect } from "chai";
import { readFileSync } from "fs";

import { midiTrackGenerator2 } from "./midi-scheduler";
import { SSRContext } from "./ssrctx";

describe("midiTrackGenerator", () => {
  it("reads midi and outputs notes in JIT fashion", async () => {
    const ctx = SSRContext.default;
    const midi = new Midi(readFileSync("song.mid"));
    const midiSource = midiTrackGenerator2(ctx, midi.tracks, midi.header);
    const { done, value } = await midiSource.next();
    expect(done).false;
    expect(value[0]).to.exist;
  });
});
