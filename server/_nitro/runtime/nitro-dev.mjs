import "#nitro-internal-pollyfills";
import { useNitroApp } from "nitropack/runtime";
import { runTask } from "nitropack/runtime";
import { trapUnhandledNodeErrors } from "nitropack/runtime/internal";
import { startScheduleRunner } from "nitropack/runtime/internal";
import { scheduledTasks, tasks } from "#nitro-internal-virtual/tasks";

import { mkdirSync } from "node:fs";
import { Server, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parentPort, threadId } from "node:worker_threads";
import {
  defineEventHandler,
  getQuery,
  getRouterParam,
  readBody,
  toNodeListener,
} from "h3";
import { isWindows, provider } from "std-env";

const nitroApp = useNitroApp();

const requestListener = toNodeListener(nitroApp.h3App);
const server = new Server(requestListener);
server.on("upgrade", (req) => {
  requestListener(req, new ServerResponse(req));
});

function getAddress() {
  if (
    provider === "stackblitz" ||
    process.env.NITRO_NO_UNIX_SOCKET ||
    process.versions.bun
  ) {
    return 0;
  }
  const socketName = `worker-${process.pid}-${threadId}.sock`;
  if (isWindows) {
    return join(String.raw`\\.\pipe\nitro`, socketName);
  }
  const socketDir = join(tmpdir(), "nitro");
  mkdirSync(socketDir, { recursive: true });
  return join(socketDir, socketName);
}

const listenAddress = getAddress();
const listener = server.listen(listenAddress, () => {
  const _address = server.address();
  parentPort?.postMessage({
    event: "listen",
    address:
      typeof _address === "string"
        ? { socketPath: _address }
        : { host: "localhost", port: _address?.port },
  });
});

// Register tasks handlers
nitroApp.router.get(
  "/_nitro/tasks",
  defineEventHandler(async (event) => {
    const _tasks = await Promise.all(
      Object.entries(tasks).map(async ([name, task]) => {
        const _task = await task.resolve?.();
        return [name, { description: _task?.meta?.description }];
      })
    );
    return {
      tasks: Object.fromEntries(_tasks),
      scheduledTasks,
    };
  })
);
nitroApp.router.use(
  "/_nitro/tasks/:name",
  defineEventHandler(async (event) => {
    const name = getRouterParam(event, "name");
    const payload = {
      ...getQuery(event),
      ...(await readBody(event)
        .then((r) => r?.payload)
        .catch(() => ({}))),
    };
    return await runTask(name, { payload });
  })
);

// Trap unhandled errors
trapUnhandledNodeErrors();

// Graceful shutdown
async function onShutdown(signal) {
  await nitroApp.hooks.callHook("close");
}
parentPort?.on("message", async (msg) => {
  if (msg && msg.event === "shutdown") {
    await onShutdown();
    parentPort?.postMessage({ event: "exit" });
  }
});

// Scheduled tasks
if (import.meta._tasks) {
  startScheduleRunner();
}