/// <reference types="node" />
export declare class CacheStore {
    cache: Buffer;
    cacheKeys: string[];
    n: number;
    objectbyteLength: number;
    constructor(size: number, objectbyteLength: number, file?: string);
    set(key: string, value: Buffer): void;
    malloc(key: string): Buffer;
    read(key: string): Buffer;
    get length(): number;
}
export declare function cacheStore(size: number, objectByteLength: number): CacheStore;
