const cluster = require("cluster");
// deepcode ignore HttpToHttps: https provided on production with NGINX
const http = require("http");
const numCPUs = require("os").cpus().length;
const process = require("process");

const statik = require("node-static");

/**
 * @dev multiple folder listener can be added
 */
const public = new statik.Server("./public");

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) cluster.fork();

  cluster.on("exit", (worker) =>
    console.log(`worker ${worker.process.pid} died`)
  );
} else {
  http
    .createServer((req, res) =>
      req
        .addListener("end", () => {
          public.serve(req, res, (err) => {
            if (err) {
              console.error("Error serving\t" + req.url + " - " + err.message);

              res.writeHead(err.status, err.headers).end();
            }
          });
        })
        .resume()
    )
    .listen(process.env.PORT || 8000);

  console.log(`Worker ${process.pid} started`);
}
