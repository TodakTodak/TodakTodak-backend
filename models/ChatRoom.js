const mongoose = require("mongoose");

const ChatRoom = new mongoose.Schema({
  joinUsers: [
    {
      type: String,
      require: true
    }
  ],
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
