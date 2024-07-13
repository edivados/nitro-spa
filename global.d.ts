import { ViteDevServer } from "vite";

declare module 'nitropack/types' {
  interface NitroApp {
    viteDevServer?: ViteDevServer
  }
}
