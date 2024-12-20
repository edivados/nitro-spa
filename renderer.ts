import { eventHandler, H3Event } from "h3";
import process from 'node:process';
import { createProxyServer } from "httpxy";

export default process.env.NODE_ENV === 'development' 
  ? lazyEventHandler(async () => {
      const proxy = createProxyServer({
        target: useRuntimeConfig().vite.url
      });
      return eventHandler(async event => {
        event.headers.has('upgrade') 
          ? await proxy.ws(event.node.req, event.node.req.socket, proxy.options)
          : await proxy.web(event.node.req, event.node.res);
      });
    })
  : eventHandler(() => $fetch('/'))