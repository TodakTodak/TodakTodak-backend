const express = require("express");
const router = express.Router();

const {
  postSignup,
  putLogin,
  AddFriend,
  getFriends,
  getWaitingFrineds,
  patchpendingFriend
} = require("../../controllers/authController");

router.get("/waitingFriend", getWaitingFrineds);
router.get("/friend", getFriends);
router.post("/", postSignup);
router.put("/", putLogin);
router.patch("/friend", AddFriend);
router.patch("/waitingFriend", patchpendingFriend);

module.exports = router;
