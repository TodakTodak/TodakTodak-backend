const express = require("express");
const router = express.Router();

const {
  getComments,
  patchComment,
  patchCommentLike
} = require("../../controllers/commentController");

router.get("/:userEmail", getComments);
router.patch("/", patchComment);
router.patch("/like", patchCommentLike);

module.exports = router;
