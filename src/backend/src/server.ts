import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

const server = createApp();

server.listen(port, host, () => {
  console.log(`zhizhi backend listening on http://${host}:${port}`);
});
