const express = require("express");
const router = express.Router();

const {
  getCategoryPost,
  postWorryPost,
  getMyPosts
} = require("../../controllers/postController");

router.post("/", postWorryPost);
router.get("/category/:category", getCategoryPost);
router.get("/:userEmail", getMyPosts);

module.exports = router;
