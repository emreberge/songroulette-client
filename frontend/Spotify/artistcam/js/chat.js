var base = new Firebase('http://gamma.firebase.com/songroulette');

function getChatForRoom(roomName) {
    return  base.child(roomName).child('Chat') 
}

function startChat(roomName, displayName) {
    console.log("Joining chat room");
    chat = getChatForRoom(roomName);
    // We use on('child_added') to be notified when new children objects are added to the chat.
    chat.on('child_added', function(childSnapshot) {
    // childSnapshot is the added object.  We'll extract the value and use it to append to
    // our messagesDiv.
    var message = childSnapshot.val();
    console.log("Getting msg");
    $("#messagesDiv").append("<em>" + message.name + "</em>: " + message.text + "<br />");
    $('#messagesDiv')[0].scrollTop = $('#messagesDiv')[0].scrollHeight;
  });

  // When the user presses enter on the message input, add the chat message to our firebase data.
  $("#messageInput").keypress(function (e) {
    if (e.keyCode == 13) {
      // Push a new object onto chatMessagesPath with the name/text that the user entered.
      chat.push({
        name:displayName,
        text:$("#messageInput").val()
      });
      $("#messageInput").val("");
                              console.log("Sending msg");
    }
  });
}

function stopChat(roomName) {
    console.log("Leaving chat room");
    getChatForRoom(roomName).off('child_added', function(){})
    $('#messageInput').unbind('keypress');
    $("#messagesDiv").html("")
}
