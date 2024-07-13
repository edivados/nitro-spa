import { defineCommand, runMain } from "citty";
import { readFileSync } from "fs";
import { fileURLToPath } from "node:url";
import solid from "vite-plugin-solid";

function clientViteConfig() {
  return {
    plugins: [solid()]
  }
}

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
        const { createNitro, createDevServer, prepare, build } = await import("nitropack");
        const devHandler = await createDevHandler();
        const nitro = await createNitro({
          dev: true,
          noPublicDir: true, // Leave handling of public dir to vite
          experimental: {
            websocket: true
          },
          devHandlers: [
            {
              route: "/",
              handler: devHandler
            }
          ],
          rollupConfig: {
            plugins: [
              {
                load(id) {
                  if (id.endsWith("nitro-dev.mjs")) {
                    return readFileSync(fileURLToPath(new URL("./lib/nitro/nitro-dev.mjs", import.meta.url)), "utf-8");
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
        const { build: viteBuild } = await import("vite");
        const { rmSync } = await import("fs");
        const { createNitro, prepare, copyPublicAssets, build } = await import("nitropack");

        await viteBuild(clientViteConfig());

        const nitro = await createNitro({
          experimental: {
            websocket: true
          },
          publicAssets: [
            {
              baseURL: "/",
              dir: fileURLToPath(new URL("./dist", import.meta.url)),
            },
          ],
          handlers: [
            { route: "/**", handler: "#indexHandler" }
          ],
          virtual: {
            "#indexHandler": `
              import { eventHandler } from 'h3'; 
              export default eventHandler(() => $fetch('/'));
            `,
          },
          rollupConfig: {
            plugins: [
              {
                load(id) {
                  if (id.endsWith("node-server.mjs")) {
                    return readFileSync(fileURLToPath(new URL("./lib/nitro/node-server.mjs", import.meta.url)), "utf-8");
                  }
                }
              }
            ]
          }
        });
        await prepare(nitro);
        await copyPublicAssets(nitro);
        rmSync("dist", { recursive: true, force: true });
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

async function createDevHandler() {
  const { fromNodeMiddleware, eventHandler } = await import("h3");
  const { createServer } = await import("vite");

  const viteServer = await createServer({
    ...clientViteConfig(),
    server: {
      middlewareMode: true,
    },
  });

  const viteHandler = fromNodeMiddleware(viteServer.middlewares);
  const router = await createNitroRouter();

  return eventHandler(event => {
      if (router.isNitroRoute(event)) return;
      return viteHandler(event);
  });
}

async function createNitroRouter() {
  const { default: fg } = (await import("fast-glob"));
  const { createRouter, addRoute, findRoute } = await import("rou3");

  const extensions = ["js", "ts"];
  const router = createRouter();
  
  fg.globSync([
    `./routes/**/*.{${extensions.join(",")}}`, 
    `./api/**/*.{${extensions.join(",")}}`
  ]).forEach(src => {
    const path = src
      .slice(src.startsWith("./api") ? 1 : "./routes".length)
      .replace(new RegExp(`\.(${(extensions).join("|")})$`), "");

    let routePath = path
    .slice(1)
    .replace(/index$/, "")
    .replace(/\[([^\/]+)\]/g, (_, m) => {
      if (m.length > 3 && m.startsWith("...")) {
        return `*${m.slice(3)}`;
      }
      if (m.length > 2 && m.startsWith("[") && m.endsWith("]")) {
        return `:${m.slice(1, -1)}?`;
      }
      return `:${m}`;
    });

    routePath = routePath?.length > 0 ? `/${routePath}` : "/";
    addRoute(router, undefined, routePath);
  });

  const cache = new Set();

  return {
    isNitroRoute: (event) => {
      const pathname = event.path.split("?")[0];
      if (cache.has(pathname)) return true;
      return Boolean(
        findRoute(router, event.method, pathname) && 
        cache.add(pathname) && 
        true
      );
    }
  };
}

runMain(command);
