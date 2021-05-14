const ChatRoom = require("../models/ChatRoom");

const activatedRoomList = {}; // { chatRoomId: { chats: [], users: [] } }

module.exports = function socket(app) {
  app.io = require("socket.io")();

  app.io.on("connect", (socket) => {
    console.log("연결 성공");

    socket.on("join room", async (data) => {
      const { chatRoomId, userNickname } = data;
      const isActivateRoom = activatedRoomList.hasOwnProperty(chatRoomId);

      if (isActivateRoom) {
        activatedRoomList[chatRoomId].users.push(userNickname);
        socket.emit("receive inital chats", activatedRoomList[chatRoomId].chats);
      } else {
        const chatRoomInfo = await ChatRoom.findById(chatRoomId).lean();

        activatedRoomList[chatRoomInfo._id] = {
          chats: chatRoomInfo.comments,
          users: [userNickname]
        };

        socket.emit("receive inital chats", activatedRoomList[chatRoomId].chats);
      }
    });

    socket.on("leave user", async (data) => {
      const { chatRoomId, userNickname } = data;
      const currentRoom = activatedRoomList[chatRoomId];
      const joinUsers = currentRoom.users;

      const filteredLeaveUsers = joinUsers.filter((user) =>
        user !== userNickname
      );

      if (!filteredLeaveUsers.length) {
        const chatRoom = await ChatRoom.findById(chatRoomId);

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
        createdAt: Date.now()
      };

      activatedRoomList[chatRoomId].chats.push(chatData);
      app.io.emit("receive chat", chatData);
    });
  });
}
