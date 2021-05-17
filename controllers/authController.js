const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const ChatRoom = require("../models/ChatRoom");

module.exports.postSignup = async (req, res, next) => {
  try {
    let { email, password, nickname } = req.body;

    if (
      email === "" ||
      password === "" ||
      nickname === ""
    ) {
      return res.status(400).json({
        errorMessage: "누락된 정보가 있습니다. 확인 부탁드립니다"
      });
    }

    const existEamil = await User.findOne({ email }).lean();

    if (existEamil) {
      return res.status(400).json({
        errorMessage: "이미 존재하는 이메일입니다. 다른 이메일을 입력해주세요"
      });
    }

    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        console.error(err.message);

        return res.status(500).json({
          errorMessage: "서버에 문제가 발생했습니다."
        });
      }

      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          console.error(err.message);

          return res.status(500).json({
            errorMessage: "서버에 문제가 발생했습니다."
          });
        }

        password = hash;

        const user = new User({
          email,
          password,
          nickname
        });

        await user.save();

        return res.status(201).json({
          errorMessage: null
        });
      });
    });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      errorMessage: "서버에 문제가 발생했습니다."
    });
  }
};

module.exports.putLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existUser = await User.findOne({ email }).lean();

    if (!existUser) {
      return res.status(403).json({
        errorMessage: "존재하지 않는 이메일입니다.",
        loginInfo: null,
        token: null
      });
    }

    const checkPassword = () => {
      bcrypt.compare(password, existUser.password, async (err, isMatch) => {
        if (err) {
          console.error(err.message);

          return res.status(500).json({
            errorMessage: "로그인에 실패했습니다",
            loginInfo: null,
            token: null
          });
        }

        if (isMatch) {
          const accessToken = jwt.sign(
            {
              userID: existUser._id.toString()
            },
            process.env.SECRET_TOKEN,
            {
              expiresIn: "7d"
            }
          );

          return res.json({
            errorMessage: null,
            loginInfo: existUser,
            token: accessToken
          });
        }

        res.status(403).json({
          errorMessage: "비밀번호가 틀렸습니다",
          loginInfo: null,
          token: null
        });
      });
    };

    checkPassword();
  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      errorMessage: "서버에 문제가 발생했습니다",
      loginInfo: null,
      token: null
    });
  }
};

module.exports.AddFriend = async (req, res, next) => {
  try {
    const { currentUser, targetUser } = req.body;

    const requestUser = await User.findOne({ email: currentUser });
    const receivedUser = await User.findOne({ email: targetUser });

    const requestUserFriends = requestUser.friends;
    let requestUserWaitingFriends = requestUser.friendsWaitingList;
    let receivedUserFWaitingriends = receivedUser.friendsWaitingList;

    const isAlreadyFriend = requestUserFriends.some((friend) =>
      String(friend.friendInfo) === String(receivedUser._id)
    );

    if (isAlreadyFriend) {
      return res.json({ errorMessage: "이미 친구입니다." });
    }

    const isAlreadyRequest = requestUserWaitingFriends.some((friend) =>
      String(friend.friendInfo) === String(receivedUser._id));

    if (isAlreadyRequest) {
      return res.json({ errorMessage: "이미 친구 요청한 유저입니다." });
    }

    requestUserWaitingFriends.push({ friendInfo: receivedUser._id, status: "SendPending" });
    receivedUserFWaitingriends.push({ friendInfo: requestUser._id, status: "ReceivePending" });

    await requestUser.updateOne({
      "$set": { "friendsWaitingList": requestUserWaitingFriends }
    });

    await receivedUser.updateOne({
      "$set": { "friendsWaitingList": receivedUserFWaitingriends }
    });

    res.json({ errorMessage: null });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ errorMessage: "서버에 문제가 발생했습니다" });
  }
};

module.exports.getWaitingFrineds = async (req, res, next) => {
  try {
    const { user } = req.headers;

    const currentUser = await User.findOne({ email: user });
    const populatedUserInfo = await User.populate(currentUser, { path: "friendsWaitingList.friendInfo" });

    res.json({
      errorMessage: null,
      friends: populatedUserInfo.friendsWaitingList
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      errorMessage: "서버에 문제가 발생했습니다",
      friends: null
    });
  }
};

module.exports.patchAcceptFriend = async (req, res, next) => {
  try {
    const { friendEmail, user } = req.body;

    const currentUser = await User.findOne({ email: user });
    const targetUser = await User.findOne({ email: friendEmail });

    const currentUserWaitingFriends = currentUser.friendsWaitingList;
    const targetUserWaitingFriends = targetUser.friendsWaitingList;

    const filterUserWaitingFriends = currentUserWaitingFriends.filter((waitingFriend) =>
      String(waitingFriend.friendInfo) !== String(targetUser._id)
    );
    const filterTargetWaitingFriends = targetUserWaitingFriends.filter((waitingFriend) =>
      String(waitingFriend.friendInfo) !== String(currentUser._id)
    );

    const newChatRoom = await ChatRoom.create({});

    currentUser.friends.push({
      friendInfo: targetUser._id,
      chatRoomId: newChatRoom._id
    });

    targetUser.friends.push({
      friendInfo: currentUser._id,
      chatRoomId: newChatRoom._id
    });

    await currentUser.save();
    await targetUser.save();

    await currentUser.update({
      "$set": { "friendsWaitingList": filterUserWaitingFriends }
    });

    await targetUser.update({
      "$set": { "friendsWaitingList": filterTargetWaitingFriends }
    });

    const acceptInfo = await User
      .findOne({ email: user })
      .populate("friends.friendInfo")
      .populate("friendsWaitingList.friendInfo")
      .lean();

    res.json({
      errorMessage: null,
      friends: acceptInfo.friends,
      waitingFriend: acceptInfo.friendsWaitingList
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ errorMessage: "서버에 문제가 발생했습니다" });
  }
};

module.exports.patchRejectFriend = async (req, res, next) => {
  try {
    const { friendEmail, user } = req.body;

    const currentUser = await User.findOne({ email: user });
    const targetUser = await User.findOne({ email: friendEmail });

    const currentUserWaitingFriends = currentUser.friendsWaitingList;
    const targetUserWaitingFriends = targetUser.friendsWaitingList;

    const filterUserWaitingFriends = currentUserWaitingFriends.filter((waitingFriend) =>
      String(waitingFriend.friendInfo) !== String(targetUser._id)
    );
    const filterTargetUserWaitingFriends = targetUserWaitingFriends.map((waitingFriend) => {
      if (String(waitingFriend.friendInfo) === String(currentUser._id)) {
        waitingFriend.status = "ReceiveReject";
      }

      return waitingFriend;
    });

    await targetUser.updateOne({
      "$set": { "friendsWaitingList": filterTargetUserWaitingFriends }
    });

    await currentUser.updateOne({
      "$set": { "friendsWaitingList": filterUserWaitingFriends }
    });

    const rejectInfo = await User
      .findOne({ email: user })
      .populate("friendsWaitingList.friendInfo")
      .lean();

    res.json({
      errorMessage: null,
      waitingFriend: rejectInfo.friendsWaitingList
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ errorMessage: "서버에 문제가 발생했습니다" });
  }
};

module.exports.getFriends = async (req, res, next) => {
  try {
    const { user } = req.headers;

    const currentUser = await User.findOne({ email: user });
    const populatedUser = await User.populate(
      currentUser,
      { path: "friends.friendInfo" }
    );

    res.json({
      errorMessage: null,
      friends: populatedUser.friends
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      errorMessage: "서베에 문제가 발생했습니다",
      friends: null
    });
  }
};

module.exports.getMyPosts = async (req, res, next) => {
  try {
    const { useremail } = req.headers;
    const populatedUser = await User
      .findOne({ email: useremail })
      .populate("posts");

    res.json({
      errorMessage: null,
      postsInfo: populatedUser.posts
    });
  } catch (err) {
    console.error(err.message);

    return res.status(500).json({
      errorMessage: "게시물을 가져오는데 실패했습니다",
      posts: null
    });
  }
};
