const cluster = require('node:cluster');
const express = require("express");
require("dotenv").config();
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');


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

    const router = require('./routes.js');


    app.get('/', (req, res) => {
        res.send(`Hello from worker ${process.pid}`);
    });

    app.listen(3000, () => {
        console.log(`Worker ${process.pid} started`);
    });


    app.use(express.json({extended: false}));
  
    app.use("/api/v1", router);

    const swaggerDocument = YAML.load('./openapi_apis.yaml');

    app.use('/openapi/app', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}