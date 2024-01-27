export default lazyEventHandler(async () => {
  return eventHandler((event) => {
    if (event.headers.get("upgrade") !== "websocket") {
      sendWebResponse(event, new Response(null, { status: 426 }));
      return;
    }
    useWebsocketServer().handleUpgrade(event.node.req, event.node.req.socket, Buffer.alloc(0), (client) => {
      console.log("connected");
    });
    event._handled = true;
  });
});
