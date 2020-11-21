"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const flat_cache_store_1 = require("./flat-cache-store");
// console.log(test);
// test("cache store", function(t){
//     console.log(t);
//     t.plan(2);
//     const cache = cacheStore(100, 3);
//     cache.set("k1", Buffer.from([1,2,3]));
//     const v = cache.read("k1");
//     t.deepEqual(v, Buffer.from([1,2,3]));
//     const floatCache = cacheStore(160, 4);
//     const ob = floatCache.malloc('k2');
//     ob.writeFloatBE(1.2);
//     t.equal(~~(floatCache.read('k2').readFloatBE(0) * 10) ,12);
// });
describe("cache store", () => {
  it("instantiates with buffer size, and size of eleemnt", () => {
    const cache = new flat_cache_store_1.CacheStore(100, 3);
    chai_1.expect(cache.length).eq(0);
    cache.malloc("1");
    chai_1.expect(cache.length).eq(1);
  });
  it("instantiates with buffer size, and size of eleemnt", () => {
    const before = process.memoryUsage();
    const cache = new flat_cache_store_1.CacheStore(100, 3);
    const after = process.memoryUsage();
    chai_1.expect(after.heapUsed - before.heapUsed).greaterThan(0);
  });
});
//# sourceMappingURL=flat-cache-store.test.js.map
