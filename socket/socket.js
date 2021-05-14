const activatedRoomList = {};

module.exports = function socket(app) {
  app.io = require("socket.io")();

  app.io.on("connect", (socket) => {
    console.log("연결 성공");

    socket.on("join room", (data) => {
      const { userEmail, friendEmail } = data;
    });

    socket.on("send chat", (data) => {
      const { userEmail, comment } = data;

      const chatData = {
        userEmail,
        comment,
        createdAt: Date.now()
      };

      app.io.emit("receive chat", chatData);
    });
  });
}
