import { expect } from "chai";
import { FileSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";

describe("codec", () => {
  it("decode s16", () => {
    const ctx = SSRContext.fromFileName("db/testdata/s16le-ac1-ar-9000.pcm");
    expect(ctx.bitDepth).eq(16);
    expect(ctx.nChannels).eq(1);

    const file = new FileSource(ctx, {
      filePath: "db/testdata/s16le-ac1-ar-9000.pcm",
    });
    const buff = file.pullFrame();

    console.log(buff);
  });
});
