const express = require("express");
const router = express.Router();

const {
  getCategoryPost,
  patchPostLike,
  postWorryPost,
  getMyPosts
} = require("../../controllers/postController");

router.post("/", postWorryPost);
router.patch("/", patchPostLike);
router.get("/category/:category", getCategoryPost);
router.get("/:userEmail", getMyPosts);

module.exports = router;
