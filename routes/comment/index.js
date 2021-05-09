const express = require("express");
const router = express.Router();

const {
  postComment,
  getComments
} = require("../../controllers/commentController");

router.get("/:userEmail", getComments);
router.post("/", postComment);

module.exports = router;
