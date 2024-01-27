export default lazyEventHandler(async () => {
  const ws = new (await import("ws")).WebSocketServer({ noServer: true });
  return eventHandler((event) => {
    event.context.ws = ws;
    if (event.headers.get("upgrade") !== "websocket") {
      sendWebResponse(event, new Response(null, { status: 426 }));
      return;
    }
    ws.handleUpgrade(event.node.req, event.node.req.socket, Buffer.alloc(0), (client) => {
      console.log("connected");
    });
    event._handled = true;
  });
});
