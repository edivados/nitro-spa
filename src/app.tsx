import { onMount } from "solid-js";

export default function Root() {
  onMount(() => {
    const protocol = window.location.protocol.endsWith("s:") ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(url);
    socket.addEventListener("open", () => {
      console.log("open");
      alert("connected");
    });
    socket.addEventListener("close", (ev) => {
      console.log("close", ev);
    });
    socket.addEventListener("error", () => {
      console.log("error");
    });
  });
  return (
    <div>SPA</div>
  )
}