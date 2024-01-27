import { WebSocketServer } from "ws";

const server = new WebSocketServer({ noServer: true });

export function useWebsocketServer() {
  return server;
}
