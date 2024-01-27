export default lazyEventHandler(async () => {
  return fromNodeMiddleware(useNitroApp().viteDevServer.middlewares);
});
