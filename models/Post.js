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
  catagory: {
    type: String,
    enum: [
      "love",
      "course",
      "employment",
      "friend",
      "pain"
    ],
    default: "love"
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
