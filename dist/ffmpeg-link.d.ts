/// <reference types="node" />
import { Writable } from "stream";
import { Buffer } from "buffer";
import { CacheStore } from "./flat-cache-store";
import { MidiNote } from ".";
export declare type CastFunction = () => Writable;
export declare const pcm_note_size: number;
export declare const castInput: CastFunction;
export declare const cspawnToBuffer: (cmd: string, str: string, ob: Buffer) => Promise<void>;
export declare function ffmpegToBuffer(args: string, ob: Buffer): void;
export declare const mp3db: (inst: string, midi: number) => string;
export declare type CombinedNotes = {
    start: number;
    midis: MidiNote[];
    buffer?: Buffer;
};
export declare const combinemp3: (combinedNote: CombinedNotes, noteCache: CacheStore, format: string, aoptions: string) => Promise<Buffer>;
