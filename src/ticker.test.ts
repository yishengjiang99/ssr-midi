import { Midi } from "@tonejs/midi";
import { expect } from "chai";
import { execSync } from "child_process";
import { readFile, readFileSync } from "fs";
import { Ticker } from "./ticker";

describe("ticker", () => {
  it("keeps time according to tempo", (done) => {
    const mid = new Midi(readFileSync("song.mid"));
    const ticker = new Ticker(mid.header);
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
