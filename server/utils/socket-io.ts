import { createServer } from "node:http";
import { Server } from "socket.io";

const httpServer = createServer();
const server = new Server(httpServer, { serveClient: false, path: "/io/" });

server.on("connection", () => {
  console.log("socket-io", "Someone connected.");
});

export function useSocketIOServer() {
  return { server, httpServer };
}
