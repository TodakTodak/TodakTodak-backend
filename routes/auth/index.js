const express = require("express");
const router = express.Router();

const { postSignup, putLogin } = require("../../controllers/authController");

router.post("/", postSignup);
router.put("/", putLogin);

module.exports = router;
