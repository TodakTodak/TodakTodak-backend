const express = require("express");
const router = express.Router();

const authRouter = require("../routes/auth/index");
const postRouter = require("../routes/post/index");

router.use("/auth", authRouter);
router.use("/post", postRouter);

module.exports = router;
