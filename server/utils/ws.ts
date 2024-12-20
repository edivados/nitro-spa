import { WebSocketServer } from "ws";

const server = new WebSocketServer({ noServer: true });

server.on("connection", () => {
  console.log("ws:", "Someone connected.");
})

export function useWebsocketServer() {
  return { server };
}
