import cluster from "node:cluster";
const workers = Math.max(1, Number(process.env.WEB_CONCURRENCY) || 1);
if (cluster.isPrimary && workers > 1) {
  console.log(`[cluster] primary ${process.pid} forking ${workers} workers`);
  for (let i = 0; i < workers; i++) cluster.fork();
  cluster.on("exit", (worker, code, signal) => {
    console.log(`[cluster] worker ${worker.process.pid} exited (${signal || code}) — respawning`);
    cluster.fork();
  });
} else {
  await import("./dist/server/entry.mjs");
}
