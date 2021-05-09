const express = require("express");
const router = express.Router();

const { postComment } = require("../../controllers/commentController");

router.post("/", postComment);

module.exports = router;
