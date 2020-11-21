import { SSRContext } from "./ssrctx";
import { CacheStore } from "./flat-cache-store";
declare type tick = number;
declare type MidiNote = {
    instrument: string;
    midi: number;
    start: tick;
    duration: tick;
};
export declare const tickToTime: (t: tick) => number;
export declare const parseMidiCSV: (line: string) => MidiNote;
export declare const initCache: (ctx: SSRContext) => CacheStore;
export {};
