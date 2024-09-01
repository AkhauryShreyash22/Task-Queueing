const Bull = require('bull');
const Redis = require('ioredis');

const fs = require('fs');

require("dotenv").config();

const config = process.env;


const taskQueue = new Bull('taskQueue', { redis: { port: 6379, host: '127.0.0.1' } });
const redis = new Redis({ port: config.redis_port, host: config.redis_host });


async function task(user_id) {
    var now = new Date();


    var formattedDate = now.toLocaleString();
    var logtxt = user_id +" - task completed at " + formattedDate +"\n";
    console.log(logtxt);
    fs.appendFile('./log.txt', logtxt, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
}

taskQueue.process(async (job) => {
    const { user_id } = job.data;
    await task(user_id);
});

console.log('processing tasks...');
