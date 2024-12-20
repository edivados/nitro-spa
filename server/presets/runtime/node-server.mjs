
import "#nitro-internal-pollyfills";
import { Server as HttpServer, ServerResponse } from "node:http";
import { Server as HttpsServer } from "node:https";
import destr from "destr";
import { toNodeListener } from "h3";
import { useNitroApp, useRuntimeConfig } from "nitropack/runtime";
import {
  setupGracefulShutdown,
  startScheduleRunner,
  trapUnhandledNodeErrors,
} from "nitropack/runtime/internal";

const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;

const nitroApp = useNitroApp();

const requestListener = toNodeListener(nitroApp.h3App);

const server =
  cert && key
    ? new HttpsServer({ key, cert }, requestListener)
    : new HttpServer(requestListener);

const port = (destr(process.env.NITRO_PORT || process.env.PORT) ||
  3000);
const host = process.env.NITRO_HOST || process.env.HOST;

const path = process.env.NITRO_UNIX_SOCKET;

// @ts-ignore
const listener = server.listen(path ? { path } : { port, host }, (err) => {
  if (err) {
    console.error(err);
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  }
  const protocol = cert && key ? "https" : "http";
  const addressInfo = listener.address();
  if (typeof addressInfo === "string") {
    console.log(`Listening on unix socket ${addressInfo}`);
    return;
  }
  const baseURL = (useRuntimeConfig().app.baseURL || "").replace(/\/$/, "");
  const url = `${protocol}://${
    addressInfo.family === "IPv6"
      ? `[${addressInfo.address}]`
      : addressInfo.address
  }:${addressInfo.port}${baseURL}`;
  console.log(`Listening on ${url}`);
});

// Trap unhandled errors
trapUnhandledNodeErrors();

// Graceful shutdown
setupGracefulShutdown(listener, nitroApp);

server.on("upgrade", (req) => {
  requestListener(req, new ServerResponse(req));
});

// Scheduled tasks
if (import.meta._tasks) {
  startScheduleRunner();
}

export default {};