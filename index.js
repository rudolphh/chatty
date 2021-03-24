const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const { LocalStorage } = require("node-localstorage");
const ipLocate = require("node-iplocate");
const publicIP = require("public-ip");

const app = express();
app.set("port", process.env.PORT || 3500);
app.use(express.static(path.join(__dirname, "public")));
let localStorage = new LocalStorage("./Scratch");

//http server created using express app
let server = http.createServer(app).listen(app.get("port"), () => {
  console.log("express app is up on ", app.get("port"));
});

let io = socketIO(server);

io.sockets.on("connection", (socket) => {
  let list = socket.client.conn.server.clients;
  let users = Object.keys(list);

  //consuming my events with labels
  socket.on("nick", (nick) => {
    socket.nickname = nick;
    socket.emit("userList", users);
  });

  socket.on("chat", (data) => {
    publicIP.v4().then((ip) => {
      ipLocate(ip).then((results) => {
        let city = JSON.stringify(results.city, null, 2);
        localStorage.setItem("userLocal", city);
      });
    });

    let nickname = socket.nickname ? socket.nickname : "";

    let payload = {
      message: data.message,
      nick: nickname,
      location: localStorage.getItem("userLocal"),
    };

    socket.emit("chat", payload);
    socket.broadcast.emit("chat", payload);
  });

});// end on "connection"
