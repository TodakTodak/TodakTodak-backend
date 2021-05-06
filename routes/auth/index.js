const express = require("express");
const router = express.Router();

const { postSignup } = require("../../controllers/authController");

router.post("/", postSignup);

module.exports = router;
