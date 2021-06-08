const express = require("express");
const router = express.Router();

const userRouter = require("./user/index");
const postRouter = require("../routes/post/index");
const commentRouter = require("../routes/comment/index");

const { authorizeUser } = require("../middlewares/authorizeUser");

router.use("/user", userRouter);
router.use("/post", authorizeUser, postRouter);
router.use("/comment", authorizeUser, commentRouter);

module.exports = router;
