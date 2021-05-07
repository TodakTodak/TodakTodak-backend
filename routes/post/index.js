const express = require("express");
const router = express.Router();

const {
  postWorryPost,
  getMyPosts
} = require("../../controllers/postController");

router.post("/", postWorryPost);
router.get("/:userEmail", getMyPosts);

module.exports = router;
