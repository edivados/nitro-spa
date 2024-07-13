export default lazyEventHandler(() => {
  const { server } = useWebsocketServer();
  return eventHandler(event => {
    if (event.headers.get("upgrade") !== "websocket") {
      sendWebResponse(event, new Response(null, { status: 426 }));
      return;
    }
    server.handleUpgrade(event.node.req, event.node.req.socket, Buffer.alloc(0), (client, request) => {
      server.emit("connection", client, request);
    });
    event._handled = true;
  });
});
