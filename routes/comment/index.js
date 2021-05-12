const express = require("express");
const router = express.Router();

const { getComments, patchComment } = require("../../controllers/commentController");

router.get("/:userEmail", getComments);
router.patch("/", patchComment);

module.exports = router;
