import { createSignal, onMount } from "solid-js";
import socketio from "socket.io-client";

export default function Root() {
  const [connectedWS, setConnectedWS] = createSignal(false);
  const [connectedIO, setConnectedIO] = createSignal(false);
  onMount(() => {
    const protocol = window.location.protocol.endsWith("s:") ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(url);
    socket.addEventListener("open", () => setConnectedWS(true));
    socket.addEventListener("close", (ev) => console.log("ws", "close", ev));
    socket.addEventListener("error", () => console.log("ws", "error"));

    const io = socketio({ path: "/io/" });
    io.on("connect", () => setConnectedIO(true));
    io.on("disconnect", () => console.log("socket.io", "disconnect"));
    io.on("connect_error", () => console.log("socket.io", "error"));
  });
  return (
    <>
      <h1>WS: { connectedWS() ? "Connected" : "Disconnected" }</h1>
      <h1>IO: { connectedIO() ? "Connected" : "Disconnected" }</h1>
    </>
  )
}