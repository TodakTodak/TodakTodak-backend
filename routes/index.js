const express = require("express");
const router = express.Router();

const authRouter = require("../routes/auth/index");

router.use("/auth", authRouter);

module.exports = router;
