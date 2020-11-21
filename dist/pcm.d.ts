/// <reference types="node" />
import { Buffer } from "buffer";
import { ChildProcess } from "child_process";
export declare const bytesPerNote: number;
export declare const bytesPCMPerNote = 38452;
export declare const midi_sample_mp3: (instrument: string, midi: number) => Buffer;
export declare const midi_s16le_ac1_ar_9000: (instrument: string, midi: number) => Promise<Buffer>;
export declare type Note = [number, string];
export interface Attributes {
    "-t": number;
}
export declare const combined_midi_s16le_ac1_ar_9000_proc: (notes: Note[], attributes: Attributes) => ChildProcess;
export declare const ffplayPCM: (format?: string) => import("child_process").ChildProcessWithoutNullStreams;
