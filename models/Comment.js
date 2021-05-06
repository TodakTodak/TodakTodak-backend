const mongoose = require("mongoose");

const Comment = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User"
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  likes: {
    type: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User"
      }
    ],
    default: []
  },
  reported: {
    type: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User"
      }
    ],
    default: []
  }
});

module.exports = mongoose.model("Comment", Comment);
