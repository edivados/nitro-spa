import { createServer } from "vite";

export default lazyEventHandler(async () => {
  const server = await createServer({
    configFile: false,
    server: {
      hmr: { port: 3001 }, 
      middlewareMode: true
    },
    plugins: [(await import("vite-plugin-solid")).default()]
  });
  return fromNodeMiddleware(server.middlewares);
});
