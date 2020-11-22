import { spawn, execSync } from "child_process";
import { createReadStream } from "fs";
import { resolve } from "path";
// import { createServer, connect } from "net";
import { PassThrough, Readable } from "stream";
import { SSRContext } from "./ssrctx";
export type FfmpegdProps = {
  n?: number;
  duration?: number;
  format?: string;
  aoptions?: string;
};
export class Ffmpegd {
  cmdargs: string[];
  inputs: string[] = [];
  output: Readable;
  ffm: number;
  monitor: PassThrough;
  n: number;
  occupied: boolean[];
  constructor(inputs: number, ctx: SSRContext) {
    this.n = inputs;
    this.monitor = new PassThrough();
    this.output = createReadStream(`/tmp/ffmpegd-output.sock`);
    this.occupied = new Array(this.n).fill(false);
    execSync("rm -rf /tmp/ffmpegd-output.sock && mkfifo /tmp/ffmpegd-output.sock");
    execSync("chmod 760 /tmp/ffmpegd-output.sock");
    const inputClause = `${[0, 1, 2, 3, 4, 5, 6, 7, 8]
      .filter((v) => v < this.n) /* subtractive array synthesis*/
      .map((u) => `-i unix:${Ffmpegd.ncPath(u)}`)
      .join(" ")}`;
    const amix = `amix=inputs=${this.n}:duration=first:dropout_transition=0`;
    const loudnorm = `dynaudnorm`;
    const filterClause = `-filter_complex ${amix},${loudnorm}`;
    const settingClause = `-y -hide_banner -loglevel debug`;
    this.cmdargs = `${settingClause} ${inputClause} ${filterClause} -f ${ctx.format} -ar ${ctx.samplesPerFrame} -ac ${ctx.nChannels} -`.split(
      " "
    );
  }
  // g=`[1:a]loudnorm=I=-16:TP=-1.5:LRA=11:linear=false[a0];\
  // [2:a]loudnorm=I=-16:TP=-1.5:LRA=11:linear=false:dual_mono=true,adelay=7680|7680,apad=whole_len=2346240[a1];
  // [3:a]loudnorm=I=-16:TP=-1.5:LRA=11:linear=false:dual_mono=true,adelay=14640|14640,apad=whole_len=2346240[a2];
  // [4:a]loudnorm=I=-16:TP=-1.5:LRA=11:linear=false:dual_mono=true,adelay=3240|3240,apad=whole_len=2346240[a3];
  // [a0][a1][a2][a3]amix=inputs=4:dropout_transition=0,asplit=6[audio0][audio1][audio2][audio3][audio4][audio5];`

  static ncPath = (idx: number) => `/tmp/ffmpegd-${idx}.sock`;

  run() {
    const { stderr } = spawn("ffmpeg", this.cmdargs);
    stderr.on("data", console.error);
  }
  sendFile(idx: number, file: string) {
    execSync(`rm -rf ${Ffmpegd.ncPath(idx)} && cat ${file} | nc -Ul ${Ffmpegd.ncPath(idx)}`);
  }
}
const g = new Ffmpegd(2, SSRContext.default);

g.sendFile(0, resolve(__dirname, "../db/Fatboy_trumpet/38.mp3"));
g.sendFile(1, resolve(__dirname, "../db/Fatboy_trumpet/33.mp3"));
g.run();
