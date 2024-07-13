import { defineCommand, runMain } from "citty";
import solid from "vite-plugin-solid";

async function createNitroRouter() {
  const { default: fg } = (await import("fast-glob"));
  const rou3 = await import("rou3");

  const extensions = ["js", "ts"];
  const router = rou3.createRouter();
  
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
    rou3.addRoute(router, undefined, routePath);
  });

  const cache = new Set();

  return {
    isNitroRoute: (event) => {
      const pathname = event.path.split("?")[0];
      if (cache.has(pathname)) return true;
      return Boolean(
        rou3.findRoute(router, event.method, pathname) && 
        cache.add(pathname) && 
        true
      );
    }
  };
}

async function createDevHandler() {
  const h3 = await import("h3");
  const vite = await import("vite");

  const viteServer = await vite.createServer({
    server: {
      middlewareMode: true
    },
    plugins: [solid()]
  });

  const viteHandler = h3.fromNodeMiddleware(viteServer.middlewares);
  const router = await createNitroRouter();

  return h3.eventHandler(event => {
      if (router.isNitroRoute(event)) return;
      return viteHandler(event);
  });
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
        const nitropack = await import("nitropack");
        const devHandler = await createDevHandler();
        const nitro = await nitropack.createNitro({
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
        });
        const server = nitropack.createDevServer(nitro);
        await server.listen(port);
        await nitropack.prepare(nitro);
        await nitropack.build(nitro);
      },
    },
    build: {
      run: async () => {
        const vite = await import("vite");
        const fs = await import("fs");
        const { fileURLToPath } = await import("node:url");
        const nitropack = await import("nitropack");

        await vite.build({
          plugins: [solid()]
        });

        const nitro = await nitropack.createNitro({
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
          }
        });
        await nitropack.prepare(nitro);
        await nitropack.copyPublicAssets(nitro);
        fs.rmSync("dist", { recursive: true, force: true });
        await nitropack.build(nitro);
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
