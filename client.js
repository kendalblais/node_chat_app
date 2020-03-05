

$(function () {
    var socket = io();

    var nickname = '';

    $('form').submit(function(e){
      e.preventDefault(); // prevents page reloading
      socket.emit('chat message', $('#m').val());
      $('#m').val('');
      return false;
    });

    // socket.on('connect', function() {
    //     socket.emit('authenticate');
    // });
    socket.on('populate chat', function(messages) {
        $.each(messages, function(message) {
            name = messages[message].user;
            msg = messages[message].message;
            time = new Date(messages[message].timestamp);
            formatedTime = time.toTimeString().substr(0,5);
            color = messages[message].color;

            if(name === nickname){
                name += "(you)";
                $('#messages').append('<li style="float: right;">' + formatedTime + "\t" + '-\t<span style="color:' + color + '">' + name + '</span>:<br>' + msg);
            } else {
                $('#messages').append('<li style="float: left;">' + formatedTime + "\t" + '-\t<span style="color:' + color + '">' + name + '</span>:<br>' + msg);
            }

            $('#messages').animate({
                scrollTop: $('#messages').prop('scrollHeight')
            }, 1);
        });
    });

    socket.on('nickname', function(name) {
        nickname = name;
    });

    socket.on('online users', function(users){
        $('#users').empty();
        $.each(users, function(usr) {
            name = users[usr];
            if(name === nickname){
                name += "(you)";
            }

            $('#users').append($('<li>').text(name));
        });
    });

    socket.on('disconnect', function() {
        console.log("Server disconnected");
    });

    socket.on('chat message', function(message){
        name = message.user;
        msg = message.message;
        time = new Date(message.timestamp);
        formatedTime = time.toTimeString().substr(0,5);
        color = message.color;

        if(name === nickname){
            name += "(you)";
            $('#messages').append('<li style="float: right;">' + formatedTime + " " + '- <span style="color:' + color + '">' + name + '</span>:<br>' + msg);
        } else {
            $('#messages').append('<li style="float: left;">' + formatedTime + " " + '- <span style="color:' + color + '">' + name + '</span>:<br>' + msg);
        }

        $('#messages').animate({
            scrollTop: $('#messages').prop('scrollHeight')
        }, 1);
    });

    socket.on('command result', function(msg) {
        message = msg.message;
        time = new Date(msg.timestamp);
        formatedTime = time.toTimeString().substr(0,5);
        $('#messages').append('<li style="float: left;">' + formatedTime + " " + '- <span style="color: black">Server</span>:<br>' + message);
        $('#messages').animate({
            scrollTop: $('#messages').prop('scrollHeight')
        }, 1);
    });
});