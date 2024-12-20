# Vite SPA + Nitro Server with Socket.IO & WS in Node environment

This repository demonstrates how to set up a Single Page Application (SPA) using Vite, integrated with a Nitro server, and demonstrates how to use Socket.IO and WebSockets (WS) for real-time communication.

## Overview

### Websocket upgrade handling

In development, the project overwrites Nitros dev preset and uses a custom Node preset in production to enable passing upgrade requests to route handlers. The built in websocket support with crossws is disabled.

#### Socket.IO with Nitro

Socket.IO is a bit tricky because it expects to be passed an http server instance. For production, it would be possible to make the server accessible, but there doesn't seem to be a way to do that in development because of the way Nitro works under the hood, with a listen instance and worker running the actual server code.

A solution I settled with is to pass a Node HTTP server instance to Socket.IO without starting it, and manually emit the `request` and `upgrade` events on the server instance.

```ts
export default lazyEventHandler(() => {
  const { httpServer } = useSocketIOServer();
  return eventHandler(event => {
    event.headers.get("upgrade") === "websocket"
      ? httpServer.emit("upgrade", event.node.req, event.node.req.socket, Buffer.alloc(0))
      : httpServer.emit("request", event.node.req, event.node.res);
      event._handled = true;
  });
});

```

#### WS with Nitro

Nothing special here, using the `handleUpgrade` function of WS in the ws server route.

### Request handling

In development, the Nitro renderer proxies requests with [httpxy](https://github.com/unjs/httpxy) to Vite, while in production, it returns the content of `index.html`.

## Running the appplication

### Installation

Clone the repository and install the necessary dependencies:
```sh
git clone https://github.com/edivados/nitro-spa.git 
cd nitro-spa 
pnpm install
```

### Usage

To start the development server, run the following command:

```sh
pnpm dev
```

This will start the Vite server along with the Nitro server.