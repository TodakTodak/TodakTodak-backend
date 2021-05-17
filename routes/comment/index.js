const express = require("express");
const router = express.Router();

const {
  getComments,
  deleteComment,
  patchComment,
  patchCommentLike,
} = require("../../controllers/commentController");

router.get("/:userEmail", getComments);
router.delete("/:commentId", deleteComment);
router.patch("/", patchComment);
router.patch("/like", patchCommentLike);

module.exports = router;
