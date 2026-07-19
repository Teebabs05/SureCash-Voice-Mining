// Entry point for cPanel's "Setup Node.js App" (Passenger), which runs this
// file directly with `node server.js` and expects it to bind an HTTP server
// on the port it provides via process.env.PORT. Plain `next start` doesn't
// do this itself, so this is Next.js's documented custom-server pattern.
// CommonJS is required here (not ESM import) - Passenger runs this file
// directly with `node server.js`, not through Next.js's own module loader.
/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
});
