import { createServer } from "node:http";
import { Server } from "socket.io";
import { H3Event } from "h3";

const httpServer = createServer();
const server = new Server(httpServer, { serveClient: false, path: "/io/" });

export function useSocketIOServer() {
  return {
    server,
    handler(event: H3Event) {
      event.headers.get("upgrade") === "websocket"
      ? httpServer.emit("upgrade", event.node.req, event.node.req.socket, Buffer.alloc(0))
      : httpServer.emit("request", event.node.req, event.node.res);
    }
  };
}
