import { defineCommand, runMain } from "citty";
import { fileURLToPath } from "node:url";

const command = defineCommand({
  subCommands: {
    dev: {
      args: {
        port: {
          description: "port (default: 3000)",
          default: 3000,
        },
      },
      run: async ({ args: { port } }) => {
        const { build, createDevServer, createNitro, prepare } = await import(
          "nitropack"
        );
        const nitro = await createNitro({
          dev: true,
          rootDir: "./server",
          handlers: [{ route: "/**", handler: "./dev/handler.ts" }],
          plugins: ["./dev/server-plugin.ts"],
          experimental: {
            websocket: true
          },
        });
        const server = createDevServer(nitro);
        await server.listen(port);
        await prepare(nitro);
        await build(nitro);
      },
    },
    build: {
      run: async () => {
        await (
          await import("vite")
        ).build({
          configFile: "./client/vite.config.ts",
          root: "./client",
        });

        const { build, createNitro, copyPublicAssets, prepare } = await import(
          "nitropack"
        );
        const nitro = await createNitro({
          rootDir: "./server",
          output: { dir: fileURLToPath(new URL(".output", import.meta.url)) },
          publicAssets: [
            {
              baseURL: "/",
              dir: fileURLToPath(new URL("./client/dist", import.meta.url)),
            },
          ],
          experimental: {
            websocket: true
          }
        });
        await prepare(nitro);
        await copyPublicAssets(nitro);
        await build(nitro);
        await nitro.close();
      },
    },
    start: {
      run: () => {
        import(new URL(".output/server/index.mjs", import.meta.url).href);
      },
    },
  },
});

runMain(command);
