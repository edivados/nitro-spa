import "#internal/nitro/virtual/polyfill";
import { Server as HttpServer, ServerResponse } from "node:http";
import { Server as HttpsServer } from "node:https";
import destr from "destr";
import { toNodeListener } from "h3";
import wsAdapter from "crossws/adapters/node";
import { nitroApp } from "../app.mjs";
import { setupGracefulShutdown } from "../shutdown.mjs";
import { trapUnhandledNodeErrors } from "../utils.mjs";
import { startScheduleRunner, useRuntimeConfig } from "#internal/nitro";
const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const requestListener = toNodeListener(nitroApp.h3App);
const server = cert && key ? new HttpsServer({ key, cert }, requestListener) : new HttpServer(requestListener);
const port = destr(process.env.NITRO_PORT || process.env.PORT) || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const path = process.env.NITRO_UNIX_SOCKET;
const listener = server.listen(path ? { path } : { port, host }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const protocol = cert && key ? "https" : "http";
  const addressInfo = listener.address();
  if (typeof addressInfo === "string") {
    console.log(`Listening on unix socket ${addressInfo}`);
    return;
  }
  const baseURL = (useRuntimeConfig().app.baseURL || "").replace(/\/$/, "");
  const url = `${protocol}://${addressInfo.family === "IPv6" ? `[${addressInfo.address}]` : addressInfo.address}:${addressInfo.port}${baseURL}`;
  console.log(`Listening on ${url}`);
});
trapUnhandledNodeErrors();
setupGracefulShutdown(listener, nitroApp);
if (import.meta._websocket) {
  const { handleUpgrade } = wsAdapter(nitroApp.h3App.websocket);
  server.on("upgrade", (req) => {
    requestListener(req, new ServerResponse(req));
  });
}
if (import.meta._tasks) {
  startScheduleRunner();
}
export default {};
