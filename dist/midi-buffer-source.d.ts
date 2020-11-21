/// <reference types="node" />
import { SSRContext } from "./ssrctx";
import { CacheStore } from "./flat-cache-store";
declare type tick = number;
declare type MidiNote = {
    instrument: string;
    note: number;
    start: tick;
    duration: tick;
};
export declare const tickToTime: (t: tick) => number;
/**
 * clarinet,67,0.28301699999999996,,256,116
 */
export declare const parseMidiCSV: (line: string) => MidiNote;
export declare const initCache: (ctx: SSRContext) => CacheStore;
export declare const loadBuffer: (ctx: SSRContext, note: MidiNote, noteCache: CacheStore) => Promise<Buffer>;
export declare const preCacheNotes: (ctxstr: string, midiFile: string) => Promise<SSRContext>;
export declare function playCsv(ctxString: string, csv: string, outfile: string): void;
export {};
