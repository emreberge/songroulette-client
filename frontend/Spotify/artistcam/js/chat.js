var base = new Firebase('http://gamma.firebase.com/songroulette');

function getChatForRoom(roomName) {
    return  base.child('Chat').child(roomName)
}

function childAddedCallBack(childSnapshot) {
    // childSnapshot is the added object.  We'll extract the value and use it to append to
    // our messagesDiv.
    var message = childSnapshot.val();
    $("#messagesDiv").append("<div id=\"chatLine\"><img src=\"http://robohash.org/" + message.name + ".png?size=25x25\" height=\"25\" width=\"25\"/> " + message.text + "<br /></ div>");
    $('#messagesDiv')[0].scrollTop = $('#messagesDiv')[0].scrollHeight;
}

function startChat(roomName, displayName) {
    $("#messagesDiv").html("");
    chat = getChatForRoom(roomName);
    // We use on('child_added') to be notified when new children objects are added to the chat.
    chat.on('child_added', childAddedCallBack);

  // When the user presses enter on the message input, add the chat message to our firebase data.
  $("#messageInput").keypress(function (e) {
    if (e.keyCode == 13) {
      // Push a new object onto chatMessagesPath with the name/text that the user entered.
      chat.push({
        name:displayName,
        text:$("#messageInput").val()
      }); 
      $("#messageInput").val("");
    }
  });
    $("#messageInput").focus();
}

function stopChat(roomName) {
    getChatForRoom(roomName).off('child_added', childAddedCallBack);
    $('#messageInput').unbind('keypress');
    $("#messagesDiv").html("Disconnected");
}
