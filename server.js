/**
 * Required External Modules
 */
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var { v4: uuidv4 } = require('uuid');
var { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
var randomColor = require('randomcolor');

let messages = [];
let users = {};
let onlineUsers = [];


app.use(cookieParser());

app.use(function (req, res, next) {
  var cookie = req.cookies.chatID;
  if (cookie === undefined){
    var id = uuidv4();
    res.cookie('chatID', id, { maxAge: 60*60*1000 });
  }
  next();
});

app.use(express.static(__dirname));


app.get('/', function(req, res){ 
  res.sendFile('index.html');
});

io.on('connection', function(socket){

  var cookies = cookie.parse(socket.handshake.headers.cookie);
  var userID = cookies['chatID'];
  addUserIfNew(userID);
  

  console.log(users[userID].nn + ' connected');

  if(!onlineUsers.includes(users[userID].nn)){
    onlineUsers.push(users[userID].nn);
  }

  socket.emit('nickname', users[userID].nn);
  socket.emit('populate chat', messages);

  io.emit('online users', onlineUsers);

  socket.on('disconnect', function(){
    removeUser(users[userID].nn);
    io.emit('online users', onlineUsers);
    console.log(users[userID].nn + ' disconnected');
  });

  socket.on('chat message', function(msg){

    let time = new Date();

    if(msg.startsWith('/')){
      respMsg = processCommand(msg, userID, socket);
      socket.emit('command result', { 'message': respMsg, 'timestamp': time});
      return;
    }

    if(messages.length >= 200){
      messages.shift()
    }
  
    let newMessage = {'user': users[userID].nn, 'color': users[userID].color, 'message': msg, 'timestamp': time};
    messages.push(newMessage); 
    io.emit('chat message', newMessage);
  });



});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function processCommand(msg, userID, socket) {
  parsed = msg.split(' ');
  command = parsed[0];

  respMsg = '';
  switch(command) {
    case '/nick':
      name = parsed.slice(1).join(' ');
      if(nameFree(name)) {
        respMsg = "Your nickname is now '" + name + "'!!";
        removeUser(users[userID].nn);

        users[userID].nn = name;
        onlineUsers.push(name);
        socket.emit('nickname', name)
        io.emit('online users', onlineUsers);
        
      } else {
        respMsg = 'Failed to change nickname: Already Taken.'
      }

      break;
    case '/nickcolor':
      color = parsed[1];
      reg = new RegExp('^[0-9A-Fa-f]{6}$')
      if(reg.test(color)) {
        respMsg = "Your nickname color is now '" + color + "'!!";

        users[userID].color = '#' + color;
      } else {
        respMsg = "Failed to change nickname color: Invalid Color: '" + color + "'";
      }
      
      break;
    default:
      respMsg = "Unknown Command: '" + command + "'";
      
  }

  return respMsg;

}

function nameFree(nickname) {
  isFree = true;
  Object.values(users).forEach(userInfo => {
    if(userInfo.nn === nickname){
      isFree = false;
    }
  });

  return isFree;
}

function addUserIfNew(usrID) {
  if(!(usrID in users)){
    nickname = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });
    color = randomColor();
    users[usrID] = { 'nn': nickname, 'color': color };
  } 
}

function removeUser(username){
  const index = onlineUsers.indexOf(username);
  if (index > -1) {
    onlineUsers.splice(index, 1);
  }
}


