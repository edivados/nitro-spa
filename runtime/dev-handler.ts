export default lazyEventHandler(async () => {
  return fromNodeMiddleware(useNitroApp().vite.middlewares);
});
