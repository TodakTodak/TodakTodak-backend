const express = require("express");
const router = express.Router();

const { authorizeUser } = require("../../middlewares/authorizeUser");

const {
  patchPost,
  deletePost,
  patchPostLike,
  postWorryPost,
  getDetailPost,
  getCategoryPost,
  patchPostComments,
  patchPostCommentLike
} = require("../../controllers/postController");

router.post("/", authorizeUser, postWorryPost);
router.patch("/", authorizeUser, patchPost);
router.patch("/like", authorizeUser, patchPostLike);
router.patch("/comments", authorizeUser, patchPostComments);
router.patch("/comments/like", authorizeUser, patchPostCommentLike);
router.get("/category/:category", authorizeUser, getCategoryPost);
router.get("/:postId", authorizeUser, getDetailPost);
router.delete("/:postId", authorizeUser, deletePost);

module.exports = router;
