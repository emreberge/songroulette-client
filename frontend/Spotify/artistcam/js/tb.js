var apiKey = '1127';
var sessionId = '14685d1ac5907f4a2814fed28294d3f797f34955';
var token = 'devtoken';           
 
TB.setLogLevel(TB.DEBUG);     

var session = TB.initSession(sessionId);      
session.addEventListener('sessionConnected', sessionConnectedHandler);
session.addEventListener('streamCreated', streamCreatedHandler);      
session.connect(apiKey, token);

var publisher;

function sessionConnectedHandler(event) {
  publisher = session.publish('tokbox');

  publisher.publishAudio(false);
  // Subscribe to streams that were in the session when we connected
  subscribeToStreams(event.streams);
}
 
function streamCreatedHandler(event) {
  // Subscribe to any new streams that are created
  subscribeToStreams(event.streams);
}
 
function subscribeToStreams(streams) {
  for (var i = 0; i < streams.length; i++) {
    // Make sure we don't subscribe to ourself
    if (streams[i].connection.connectionId == session.connection.connectionId) {
      return;
    }

    var id = streams[i].streamId;

    // Create the div to put the subscriber element in to
    var box = document.createElement('div');
    box.setAttribute('class', 'box');
    box.setAttribute('id', id);
    document.getElementById('content').appendChild(box);

    var cam = document.createElement('div');
    cam.setAttribute('id', 'stream' + id);
    document.getElementById(id).appendChild(cam);
                       
    // Subscribe to the stream
    session.subscribe(streams[i], cam.id);
  }
}
