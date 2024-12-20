import { defineCommand, runMain } from "citty";

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
        const vite = await import('vite');
        const viteDevServer = await vite.createServer();
        await viteDevServer.listen();
        viteDevServer.printUrls()

        const { readFileSync } = await import('node:fs');
        const { fileURLToPath } = await import('node:url');
        const { createNitro, createDevServer, prepare, build } = await import("nitropack");
        const nitro = await createNitro({
          compatibilityDate: '2024-12-20',
          dev: true,
          noPublicDir: true, // Leave handling of public dir to vite.
          srcDir: 'server',
          renderer: 'renderer.ts',
          runtimeConfig: {
            vite: {
              url: viteDevServer.resolvedUrls.local[0]
            }
          },
          rollupConfig: {
            plugins: [
              {
                load(id) {
                  if (id.endsWith("nitro-dev.mjs")) {
                    return readFileSync(fileURLToPath(new URL("./server/presets/runtime/nitro-dev.mjs", import.meta.url)), "utf-8");
                  }
                }
              }
            ]
          }
        });
        const server = createDevServer(nitro);
        await server.listen(port);
        await prepare(nitro);
        await build(nitro);
      },
    },
    build: {
      run: async () => {
        const vite = await import("vite");
        await vite.build();

        const { fileURLToPath } = await import('node:url');
        const { readFileSync } = await import('node:fs');
        const { createNitro, prepare, copyPublicAssets, build } = await import("nitropack");
        const nitro = await createNitro({
          compatibilityDate: '2024-12-20',
          srcDir: 'server',
          renderer: 'renderer.ts',
          publicAssets: [
            {
              baseURL: "/",
              dir: fileURLToPath(new URL("./dist", import.meta.url)),
            },
          ],
          rollupConfig: {
            plugins: [
              {
                load(id) {
                  if (id.endsWith("node-server.mjs")) {
                    return readFileSync(fileURLToPath(new URL("./server/presets/runtime/node-server.mjs", import.meta.url)), "utf-8");
                  }
                }
              }
            ]
          }
        });
        await prepare(nitro);
        await copyPublicAssets(nitro);
        await build(nitro);
        await nitro.close();

        const { rmSync } = await import('node:fs');
        rmSync("dist", { recursive: true, force: true });
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
