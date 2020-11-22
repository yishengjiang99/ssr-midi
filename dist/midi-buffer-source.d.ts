/// <reference types="node" />
import { SSRContext } from "./ssrctx";
import { CacheStore } from "./flat-cache-store";
import { MidiNote } from ".";
export declare const parseMidiCSV: (line: string) => MidiNote;
export declare const loadBuffer: (ctx: SSRContext, note: MidiNote, noteCache: CacheStore) => Promise<Buffer>;
export declare const playCSVmidi: (ctx: SSRContext, notes: MidiNote[], cacheFileName: string) => Promise<void>;
export declare function playCsv(ctx: SSRContext, csv: string, outfile: string): Promise<SSRContext>;
