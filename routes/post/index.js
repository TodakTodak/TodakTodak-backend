const express = require("express");
const router = express.Router();

const {
  patchPost,
  deletePost,
  patchPostLike,
  postWorryPost,
  getDetailPost,
  getCategoryPost,
  patchPostComments,
  patchPostCommentLike,
} = require("../../controllers/postController");

router.post("/", postWorryPost);
router.patch("/", patchPost);
router.patch("/like", patchPostLike);
router.patch("/comments", patchPostComments);
router.patch("/comments/like", patchPostCommentLike);
router.get("/category/:category", getCategoryPost);
router.get("/:postId", getDetailPost);
router.delete("/:postId", deletePost);

module.exports = router;
