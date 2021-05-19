const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");

const activatedRoomList = {};

module.exports = function socket(app) {
  app.io = require("socket.io")();

  app.io.on("connect", (socket) => {
    socket.on("join room", async (data) => {
      const { user, chatRoomId } = data;
      const isActivateRoom = activatedRoomList.hasOwnProperty(chatRoomId);

      socket.join(chatRoomId);

      if (isActivateRoom) {
        activatedRoomList[chatRoomId].users.push(user.nickname);

        app.io.to(socket.id).emit(
          "receive inital chats",
          activatedRoomList[chatRoomId].chats
        );
      } else {
        const chatRoomInfo = await ChatRoom.findById(chatRoomId).lean();

        activatedRoomList[chatRoomInfo._id] = {
          chats: chatRoomInfo.comments,
          users: [user.nickname]
        };

        app.io.to(chatRoomId).emit(
          "receive inital chats",
          activatedRoomList[chatRoomId].chats
        );
      }

      socket.broadcast.to(chatRoomId).emit(
        "join user message",
        {
          systemMessage: `${user.nickname}님이 입장하셨습니다`,
          createdAt: new Date()
        }
      );

      const currentUser = await User.findOne({ email: user.email });
      const friendList = currentUser.friends;

      const resetMessageCountFriendList = friendList.map((friend) => {
        if (String(friend.chatRoomId) === String(chatRoomId)) {
          friend.unreadMessageCount = 0;
        }

        return friend;
      });

      await currentUser.updateOne({
        "$set": { "friends": resetMessageCountFriendList }
      });
    });

    socket.on("leave user", async (data) => {
      const { chatRoomId, user } = data;
      const currentRoom = activatedRoomList[chatRoomId];

      if (!currentRoom) return;

      const joinUsers = currentRoom.users;
      const filteredLeaveUsers = joinUsers.filter((joinUser) =>
        joinUser !== user.nickname
      );

      activatedRoomList[chatRoomId].users = filteredLeaveUsers;

      socket.broadcast.to(chatRoomId).emit(
        "leave user message",
        {
          systemMessage: `${user.nickname}님이 나갔습니다`,
          createdAt: new Date()
        }
      );

      if (!filteredLeaveUsers.length) {
        const chatRoom = await ChatRoom.findById(chatRoomId);

        delete activatedRoomList[chatRoomId];
        socket.leave(chatRoomId);

        await chatRoom.updateOne({
          "$set": { comments: currentRoom.chats }
        });
      }
    });

    socket.on("send chat", async (data) => {
      const {
        user,
        comment,
        chatRoomId,
        friendInfo
      } = data;

      const chatData = {
        comment,
        userNickname: user.nickname,
        createdAt: new Date()
      };

      activatedRoomList[chatRoomId].chats.push(chatData);
      app.io.to(chatRoomId).emit("receive chat", chatData);

      if (activatedRoomList[chatRoomId].users.length < 2) {
        const friend = await User.findOne({ email: friendInfo.email });
        const friendList = friend.friends;

        const increamentFriendList = friendList.map((friend) => {
          if (String(friend.chatRoomId) === String(chatRoomId)) {
            friend.unreadMessageCount++;
          }

          return friend;
        });

        await friend.updateOne({
          "$set": { "friends": increamentFriendList }
        });
      }
    });
  });
}
