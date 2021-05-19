const express = require("express");
const router = express.Router();

const { authorizeUser } = require("../../middlewares/authorizeUser");

const {
  getComments,
  deleteComment,
  patchComment,
  patchCommentLike,
} = require("../../controllers/commentController");

router.get("/", authorizeUser, getComments);
router.delete("/:commentId", authorizeUser, deleteComment);
router.patch("/", authorizeUser, patchComment);
router.patch("/like", authorizeUser, patchCommentLike);

module.exports = router;
