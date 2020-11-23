import { Midi } from "@tonejs/midi";
import { expect } from "chai";
import { readFileSync } from "fs";

import { playMidi } from "./midi-scheduler";
import { SSRContext } from "./ssrctx";

describe("midiTrackGenerator", () => {
  it("reads midi and outputs notes in JIT fashion", async () => {
    const ctx = SSRContext.default;
    const midiSource = await playMidi("./samples/Beethoven-Moonlight-Sonata.mid", 8000, 1);
    midiSource.on("data", (d) => {
      console.log(d);
    });
    ctx.start();
  });
});
