import { Midi } from "@tonejs/midi";
import { expect } from "chai";
import { execSync } from "child_process";
import { readFile, readFileSync } from "fs";
import { Ticker } from "./ticker";

describe("ticker", () => {
  it("keeps time according to tempo", (done) => {
    // const { tracks,  } = new Midi(readFileSync("./samples/Beethoven-Moonlight-Sonata.mid"));

    const header = {
      tempos: [
        {
          bpm: 60,
          ticks: 0,
          time: 0,
        },
      ],
      timeSignatureEvents: {
        ticks: 0,
        measure: 0,
        timeSignature: [4, 4],
      },
    };
    const mid = new Midi(readFileSync("song.mid"));
    const ticker = new Ticker(mid.header);
    ticker.on("beat", ([ticks, beat]) => {
      console.log(ticks, beat);
    });
    ticker.on("measure", (info) => {
      console.log(JSON.stringify);
    });
    ticker.on("beat", ([ticks, beat]) => {
      console.log(ticks, beat);
    });
    ticker.on("beat", ([ticks, beat]) => {
      console.log(ticks, beat);
    });
    ticker.resume();
    ticker.doTick();
    expect(ticker.ticks).to.equal(0);

    done();
  });
});
// });
// // execSync("cat song.mid | nc -l 3006");
// const mid = new Midi(readFileSync("song.mid"));
// const ticker = new Ticker(mid.header);
// mid.header.keySignatures;
// ticker.doTick();
// console.log(ticker.ticks, ticker.measure);
// ticker.doTick();
// console.log(ticker.ticks, ticker.measure);
// ticker.doTick();
// console.log(ticker.ticks, ticker.measure);
// ticker.doTick();
// console.log(ticker.ticks, ticker.measure);
// ticker.doTick();
// console.log(ticker.ticks, ticker.measure);
// ticker.doTick();
// console.log(ticker.ticks, ticker.measure);
// ticker.doTick();
// console.log(ticker.ticks, ticker.measure);
// ticker.doTick();
// console.log(ticker.ticks, ticker.measure);
// ticker.doTick();
// console.log(ticker.ticks, ticker.measure);
// ticker.doTick();
// console.log(ticker.ticks, ticker.measure);
// ticker.doTick();
// console.log(ticker.ticks, ticker.measure);
// ticker.doTick();
// console.log(ticker.ticks, ticker.measure);
// ticker.doTick();
// console.log(ticker.ticks, ticker.measure);
