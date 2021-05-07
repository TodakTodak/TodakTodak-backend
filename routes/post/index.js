const express = require("express");
const router = express.Router();

const { postWorryPost } = require("../../controllers/postController");

router.post("/", postWorryPost);

module.exports = router;
