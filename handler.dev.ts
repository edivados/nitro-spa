import { createServer } from "vite";

export default lazyEventHandler(async () => {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    plugins: [ (await import("vite-plugin-solid")).default() ]
  });
  useNitroApp().hooks.hook("close", () => server.close());
  return fromNodeMiddleware(server.middlewares);
});
