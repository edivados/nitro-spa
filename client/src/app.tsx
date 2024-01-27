import { createSignal, onMount } from "solid-js";

export default function Root() {
  const [connected, setConnected] = createSignal(false);
  onMount(() => {
    const protocol = window.location.protocol.endsWith("s:") ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(url);
    socket.addEventListener("open", () => {
      console.log("open");
      setConnected(true)
    });
    socket.addEventListener("close", (ev) => {
      console.log("close", ev);
    });
    socket.addEventListener("error", () => {
      console.log("error");
    });
  });
  return (
    <>
      <h1>{ connected() ? "Connected" : "Disconnected" }</h1>
      <div>SPA</div>
    </>
  )
}