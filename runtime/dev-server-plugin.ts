export default defineNitroPlugin(async (nitroApp) => {
  const { createServer } = await import("vite");
  nitroApp.viteDevServer = await createServer({
    configFile: "./client/vite.config.ts",
    root: "./client",
    server: {
      hmr: { port: 3001 },
      middlewareMode: true,
    },
  });
});
