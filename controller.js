const Redis = require('ioredis');
const Bull = require('bull');
require("dotenv").config();

const config = process.env;
const redis = new Redis({ port: config.redis_port, host: config.redis_host });
const taskQueue = new Bull('taskQueue', { redis: { port: config.redis_port, host: config.redis_host } });
const max_task_per_min = parseInt(config.max_task_per_min, 10) || 20;
const max_task_per_sec = parseInt(config.max_task_per_sec, 10) || 1;

async function create_task(req, res) {
    const params = req.body;
    const user_id = params['user_id'];
    const currentTime = Date.now();
    const per_sec_key = `task_${user_id}_per_sec`;
    const per_min_key = `task_${user_id}_per_min`;

    let responseSent = false; 

    try {
        await removeOutdatedEntries(per_sec_key, currentTime - 1000);
        await removeOutdatedEntries(per_min_key, currentTime - 60000);

        const [tasks_last_sec, tasks_last_min] = await Promise.all([
            redis.zcard(per_sec_key),
            redis.zcard(per_min_key)
        ]);

        console.log(`Tasks in last second: ${tasks_last_sec}/${max_task_per_sec}`);
        console.log(`Tasks in last minute: ${tasks_last_min}/${max_task_per_min}`);

        if (tasks_last_sec < max_task_per_sec && tasks_last_min < max_task_per_min) {
            await processTask(user_id, currentTime);
            await Promise.all([
                redis.zadd(per_sec_key, currentTime, currentTime),
                redis.zadd(per_min_key, currentTime, currentTime)
            ]);

            if (!responseSent) {
                responseSent = true;
                return res.json({
                    'apiresponse': {
                        'code': "0000",
                        'type': "OK",
                        'severity': "INFO",
                        'message': "Task Created Successfully",
                    }
                });
            }
        } else {
            const nextAvailableTime = Math.max(currentTime + 1000 - (currentTime % 1000), currentTime + 1000);
            console.log(`Queueing task for: ${new Date(nextAvailableTime).toISOString()}`);
            setTimeout(async () => {
                try {
                    await removeOutdatedEntries(per_sec_key, Date.now() - 1000);
                    await removeOutdatedEntries(per_min_key, Date.now() - 60000);

                    const [new_tasks_last_sec, new_tasks_last_min] = await Promise.all([
                        redis.zcard(per_sec_key),
                        redis.zcard(per_min_key)
                    ]);

                    if (new_tasks_last_sec < max_task_per_sec && new_tasks_last_min < max_task_per_min) {
                        await processTask(user_id, Date.now());
                        await Promise.all([
                            redis.zadd(per_sec_key, Date.now(), Date.now()),
                            redis.zadd(per_min_key, Date.now(), Date.now())
                        ]);

                        if (!responseSent) {
                            responseSent = true;
                            res.json({
                                'apiresponse': {
                                    'code': "0000",
                                    'type': "OK",
                                    'severity': "INFO",
                                    'message': "Task Created Successfully",
                                }
                            });
                        }
                    } else {
                        if (!responseSent) {
                            responseSent = true;
                            res.json({
                                'apiresponse': {
                                    'code': "202",
                                    'type': "INFO",
                                    'severity': "INFO",
                                    'message': `Task queued for the next available time.`,
                                }
                            });
                        }
                    }
                } catch (err) {
                    if (!responseSent) {
                        responseSent = true;
                        console.error("Error processing delayed task:", err);
                        res.status(500).json({
                            'apiresponse': {
                                'code': "1000",
                                'type': "ERROR",
                                'severity': "ERROR",
                                'message': "An error occurred while processing the delayed task."
                            }
                        });
                    }
                }
            }, nextAvailableTime - currentTime);

            if (!responseSent) {
                responseSent = true;
                return res.json({
                    'apiresponse': {
                        'code': "202",
                        'type': "INFO",
                        'severity': "INFO",
                        'message': `Task queued for the next available time.`,
                    }
                });
            }
        }
    } catch (err) {
        if (!responseSent) {
            responseSent = true;
            console.error("Error processing task:", err);
            return res.status(500).json({
                'apiresponse': {
                    'code': "1000",
                    'type': "ERROR",
                    'severity': "ERROR",
                    'message': "An error occurred while processing the task."
                }
            });
        }
    }
}

async function removeOutdatedEntries(key, threshold) {
    await redis.zremrangebyscore(key, '-inf', threshold);
}

async function processTask(user_id, scheduledTime) {
    await taskQueue.add({ user_id, scheduledTime });
}

module.exports = {
    create_task
};
