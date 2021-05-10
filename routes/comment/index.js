const express = require("express");
const router = express.Router();

const { getComments } = require("../../controllers/commentController");

router.get("/:userEmail", getComments);

module.exports = router;
