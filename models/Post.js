const mongoose = require("mongoose");

const Post = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "User"
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isAnonymous: {
    type: String,
    required: true
  },
  contents: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      "사랑",
      "진로",
      "취업",
      "친구",
      "고통"
    ],
    default: "사랑"
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  comments: {
    type: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Comment"
      }
    ],
    default: []
  },
  likes: {
    type: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User"
      }
    ],
    default: []
  }
});

module.exports = mongoose.model("Post", Post);
