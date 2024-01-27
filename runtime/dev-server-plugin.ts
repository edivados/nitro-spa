export default defineNitroPlugin(async nitroApp => {
  const { createServer } = await import("vite");
  nitroApp.viteDevServer = await createServer({
    configFile: false,
    root: "./client",
    server: {
      hmr: { port: 3001 }, 
      middlewareMode: true
    },
    plugins: [(await import("vite-plugin-solid")).default()]
  });
})
