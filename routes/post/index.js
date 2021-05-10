const express = require("express");
const router = express.Router();

const {
  patchPostCommentLike,
  patchPostComments,
  getCategoryPost,
  patchPostLike,
  postWorryPost,
  getMyPosts,
} = require("../../controllers/postController");

router.post("/", postWorryPost);
router.patch("/", patchPostLike);
router.patch("/comments", patchPostComments);
router.patch("/comments/like", patchPostCommentLike);
router.get("/category/:category", getCategoryPost);
router.get("/:userEmail", getMyPosts);

module.exports = router;
