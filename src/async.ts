const async_hooks = require("async_hooks");
const fs = require("fs");
const net = require("net");
async_hooks
  .createHook({
    init(asyncId, type, triggerAsyncId) {
      const eid = async_hooks.executionAsyncId();
      fs.writeSync(process.stdout.fd, `${type}(${asyncId}): trigger: ${triggerAsyncId} execution: ${eid}\n`);
    },
  })
  .enable();

require("net")
  .createServer((conn) => {})
  .listen(8080);
