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
        app.io.to(chatRoomId).emit(
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

      if (!filteredLeaveUsers.length) {
        const chatRoom = await ChatRoom.findById(chatRoomId);

        delete activatedRoomList[chatRoomId];
        socket.leave(chatRoomId);

        await chatRoom.updateOne({
          "$set": { comments: currentRoom.chats }
        });
      }
    });

    socket.on("send chat", (data) => {
      const { userNickname, comment, chatRoomId } = data;
      const chatData = {
        userNickname,
        comment,
        createdAt: new Date()
      };

      activatedRoomList[chatRoomId].chats.push(chatData);
      app.io.to(chatRoomId).emit("receive chat", chatData);
    });
  });
}
