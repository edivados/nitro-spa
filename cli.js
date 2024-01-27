import { defineCommand, runMain } from "citty";
import { fileURLToPath } from "url";

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
        const { build, createDevServer, createNitro } = await import(
          "nitropack"
        );
        const { toNodeListener } = await import("h3");
        const { ServerResponse } = await import("http");
        const nitro = await createNitro({
          dev: true,
          handlers: [{ route: "**", handler: "./runtime/dev-handler.ts" }],
          plugins: ["./runtime/dev-server-plugin.ts"],
        });
        const server = createDevServer(nitro);
        const listener = await server.listen(port);
        const nodeListener = toNodeListener(server.app);
        listener.server.on("upgrade", (req) => {
          nodeListener(req, new ServerResponse(req));
        });
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
          preset: "./preset",
          handlers: [{ route: "**", handler: "./runtime/handler.ts" }],
          publicAssets: [
            {
              baseURL: "/",
              dir: fileURLToPath(new URL("./client/dist", import.meta.url)),
            },
          ],
        });
        await prepare(nitro);
        await copyPublicAssets(nitro);
        await build(nitro);
        nitro.close();
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
