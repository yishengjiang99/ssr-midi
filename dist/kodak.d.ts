/// <reference types="node" />
export declare class Encoder {
    bitDepth: number;
    constructor(bitDepth: number);
    encode(buffer: Buffer, value: number, index: number): void;
}
export declare class Decoder {
    bitDepth: number;
    constructor(bitDepth: number);
    decode(buffer: Buffer, index: number): number;
}
export declare const decode32: Decoder;
export declare const decode16: Decoder;
