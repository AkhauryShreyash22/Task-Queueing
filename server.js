const cluster = require('node:cluster');
const express = require("express");
require("dotenv").config();

var config = process.env;

if (cluster.isMaster) {
    var workers = config.cluster_workers;
    console.log(`Process pid: ${process.pid} is running`);

    for (let i = 0; i < workers; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    const app = express();

    app.get('/', (req, res) => {
        res.send(`Hello from worker ${process.pid}`);
    });

    app.listen(3000, () => {
        console.log(`Worker ${process.pid} started`);
    });
}