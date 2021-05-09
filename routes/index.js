const express = require("express");
const router = express.Router();

const authRouter = require("../routes/auth/index");
const postRouter = require("../routes/post/index");
const commentRouter = require("../routes/comment/index");

router.use("/auth", authRouter);
router.use("/post", postRouter);
router.use("/comment", commentRouter);

module.exports = router;
