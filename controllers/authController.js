const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");

const User = require("../models/User");
const ChatRoom = require("../models/ChatRoom");

const {
  LOGIN_FAIL,
  EXIST_EMAIL,
  NOT_EXIST_EMAIL,
  ALREADY_FRIEND,
  SERVER_MESSAGE,
  MISSING_MESSAGE,
  MISSING_PASSWORD,
  ALREADY_REQUEST_FRIEND
} = require("../constants/errorComment");

module.exports.postSignup = async (req, res, next) => {
  try {
    let { email, password, nickname } = req.body;

    if (
      email === "" ||
      password === "" ||
      nickname === ""
    ) {
      return next(createError(400, {
        errorMessage: MISSING_MESSAGE
      }));
    }

    const existEamil = await User.findOne({ email }).lean();

    if (existEamil) {
      return next(createError(400, {
        errorMessage: EXIST_EMAIL
      }));
    }

    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        console.error(err.message);

        return next(createError(500, {
          errorMessage: SERVER_MESSAGE
        }));
      }

      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          console.error(err.message);

          return next(createError(500, {
            errorMessage: SERVER_MESSAGE
          }));
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

    return next(createError(500, {
      errorMessage: SERVER_MESSAGE
    }));
  }
};

module.exports.putLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existUser = await User.findOne({ email }).lean();

    if (!existUser) {
      return next(createError(403, {
        token: null,
        loginInfo: null,
        errorMessage: NOT_EXIST_EMAIL
      }));
    }

    const checkPassword = () => {
      bcrypt.compare(password, existUser.password, async (err, isMatch) => {
        if (err) {
          console.error(err.message);

          return next(createError(500, {
            token: null,
            loginInfo: null,
            errorMessage: LOGIN_FAIL
          }));
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

        return next(createError(403, {
          token: null,
          loginInfo: null,
          errorMessage: MISSING_PASSWORD
        }));
      });
    };

    checkPassword();
  } catch (err) {
    console.error(err.message);

    return next(createError(500, {
      token: null,
      loginInfo: null,
      errorMessage: SERVER_MESSAGE
    }));
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
      return next(createError(400, ALREADY_FRIEND));
    }

    const isAlreadyRequest = requestUserWaitingFriends.some((friend) =>
      String(friend.friendInfo) === String(receivedUser._id));

    if (isAlreadyRequest) {
      return next(createError(400, ALREADY_REQUEST_FRIEND));
    }

    requestUserWaitingFriends.push({
      friendInfo: receivedUser._id,
      status: "SendPending"
    });
    receivedUserFWaitingriends.push({
      friendInfo: requestUser._id,
      status: "ReceivePending"
    });

    await requestUser.updateOne({
      "$set": { "friendsWaitingList": requestUserWaitingFriends }
    });

    await receivedUser.updateOne({
      "$set": { "friendsWaitingList": receivedUserFWaitingriends }
    });

    res.json({ errorMessage: null });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ errorMessage: SERVER_MESSAGE });
  }
};

module.exports.getWaitingFrineds = async (req, res, next) => {
  try {
    const { user } = req.headers;

    const currentUser = await User.findOne({ email: user });
    const populatedUserInfo = await User.populate(
      currentUser,
      { path: "friendsWaitingList.friendInfo" }
    );

    res.json({
      errorMessage: null,
      friends: populatedUserInfo.friendsWaitingList
    });
  } catch (err) {
    console.error(err.message);

    return next(createError(500, {
      errorMessage: SERVER_MESSAGE,
      friends: null
    }));
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

    return next(createError(500, { errorMessage: SERVER_MESSAGE }));
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

    return next(createError(500, { errorMessage: SERVER_MESSAGE }));
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

    return next(createError(500, {
      errorMessage: SERVER_MESSAGE,
      friends: null
    }));
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


    return next(createError(500, {
      errorMessage: SERVER_MESSAGE,
      postsInfo: null
    }));
  }
};
