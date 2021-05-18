const ChatRoom = require("../models/ChatRoom");

const activatedRoomList = {};

module.exports = function socket(app) {
  app.io = require("socket.io")();

  app.io.on("connect", (socket) => {
    socket.on("join room", async (data) => {
      const { chatRoomId, userNickname } = data;
      const isActivateRoom = activatedRoomList.hasOwnProperty(chatRoomId);

      socket.join(chatRoomId);

      if (isActivateRoom) {
        activatedRoomList[chatRoomId].users.push(userNickname);

        app.io.to(socket.id).emit(
          "receive inital chats",
          activatedRoomList[chatRoomId].chats
        );
      } else {
        const chatRoomInfo = await ChatRoom.findById(chatRoomId).lean();

        activatedRoomList[chatRoomInfo._id] = {
          chats: chatRoomInfo.comments,
          users: [userNickname]
        };

        app.io.to(chatRoomId).emit(
          "receive inital chats",
          activatedRoomList[chatRoomId].chats
        );
      }

      socket.broadcast.to(chatRoomId).emit(
        "join user message",
        {
          systemMessage: `${userNickname}님이 입장하셨습니다`,
          createdAt: new Date()
        }
      );
    });

    socket.on("leave user", async (data) => {
      const { chatRoomId, userNickname } = data;
      const currentRoom = activatedRoomList[chatRoomId];

      if (!currentRoom) return;

      const joinUsers = currentRoom.users;

      const filteredLeaveUsers = joinUsers.filter((user) =>
        user !== userNickname
      );

      activatedRoomList[chatRoomId].users = filteredLeaveUsers;

      socket.broadcast.to(chatRoomId).emit(
        "leave user message",
        {
          systemMessage: `${userNickname}님이 나갔습니다`,
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
        comment,
        chatRoomId,
        userNickname
      } = data;
      const chatData = {
        comment,
        userNickname,
        createdAt: new Date()
      };

      activatedRoomList[chatRoomId].chats.push(chatData);
      app.io.to(chatRoomId).emit("receive chat", chatData);
    });
  });
}
