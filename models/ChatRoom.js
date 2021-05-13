const mongoose = require("mongoose");

const ChatRoom = new mongoose.Schema({
  owner: {
    type: String,
    required: true
  },
  participant: {
    type: String,
    required: true
  },
  comments: [
    {
      nickname: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now()
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model("ChatRoom", ChatRoom);
