const express = require("express");
const router = express.Router();

const { validateSignupInfo } = require("../../middlewares/signupValidate");
const { validateLoginInfo } = require("../../middlewares/loginValidate");
const {
  postSignup,
  putLogin,
  AddFriend,
  getMyPosts,
  getFriends,
  getWaitingFrineds,
  patchAcceptFriend,
  patchRejectFriend
} = require("../../controllers/authController");

router.get("/posts", getMyPosts);
router.get("/friend", getFriends);
router.get("/waitingFriend", getWaitingFrineds);
router.post("/", validateSignupInfo, postSignup);
router.put("/", validateLoginInfo, putLogin);
router.patch("/friend", AddFriend);
router.patch("/waitingFriend", patchAcceptFriend);
router.patch("/rejectFriend", patchRejectFriend);

module.exports = router;
