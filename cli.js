import { build, createNitro, prepare, copyPublicAssets, createDevServer } from "nitropack";
import { defineCommand, runMain } from "citty";
import { fileURLToPath } from "url";

const command = defineCommand({
  subCommands: {
    dev: {
      args: {
        port: {
          description: "port (default: 3000)",
          default: 3000
        }
      },
      run: async ({ args: { port } }) => {
        const nitro = await createNitro({
          dev: true,
          noPublicDir: true,
          ignore: ["public"],
          handlers: [
            { route: "**", handler: "./handler.dev.ts" }
          ],
        });
        const server = createDevServer(nitro);
        await server.listen(port);
        await prepare(nitro)
        await build(nitro);
      }
    },
    build: {
      run: async () => {
        await (await import("vite")).build({
          configFile: false,
          build: {
            outDir: "./.build/client"
          },
          plugins: [(await import("vite-plugin-solid")).default()]
        });
        
        const nitro = await createNitro({
          dev: false,
          handlers: [
            { route: "**", handler: "./handler.ts" }
          ],
          publicAssets: [
            { baseURL: "/", dir: fileURLToPath(new URL(".build/client", import.meta.url)) }
          ]
        });
        await prepare(nitro);
        await copyPublicAssets(nitro);
        await build(nitro);
        nitro.close();
      }
    },
    start: {
      run: () => {
        import(new URL(".output/server/index.mjs", import.meta.url).href);
      }
    }
  }
});

runMain(command);
