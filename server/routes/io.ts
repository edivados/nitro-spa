export default lazyEventHandler(() => {
  const { httpServer } = useSocketIOServer();
  return eventHandler(event => {
    event.headers.get("upgrade") === "websocket"
      ? httpServer.emit("upgrade", event.node.req, event.node.req.socket, Buffer.alloc(0))
      : httpServer.emit("request", event.node.req, event.node.res);
      event._handled = true;
  });
});
