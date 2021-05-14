const mongoose = require("mongoose");

const ChatRoom = new mongoose.Schema({
  comments: {
    type: [
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
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model("ChatRoom", ChatRoom);
