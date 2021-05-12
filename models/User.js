const mongoose = require("mongoose");

const User = new mongoose.Schema({
  email: {
    type: String,
    require: true,
    unique: true
  },
  password: {
    type: String
  },
  nickname: {
    type: String,
    require: true
  },
  posts: {
    type: [{
      type: mongoose.Types.ObjectId,
      ref: "Post"
    }],
    default: []
  },
  friends: {
    type: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User"
      }
    ],
    default: []
  },
  friendsWaitingList: {
    type: [
      {
        userId: {
          type: mongoose.Types.ObjectId,
          ref: "User"
        },
        status: {
          type: String,
          enum: [
            "SendPending",
            "ReceivePending",
            "SendReject",
            "ReceiveReject"
          ]
        }
      }
    ],
    default: []
  }
});

module.exports = mongoose.model("User", User);
