const express = require("express");
const router = express.Router();

const {
    create_task
} = require("./controller.js");

router.post("/task", create_task);

module.exports = router;