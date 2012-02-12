
var apiKey = '11827172';
var currentSessionId = '14685d1ac5907f4a2814fed28294d3f797f34955';
var token = 'devtoken';           
var session = null;
var replaceElementId = 'tokbox';
TB.setLogLevel(TB.DEBUG);

var isDisconnecting = false;
var isWaitingToConnect = false;

function connect() {
	connectWithSession(currentSessionId);
}

function connectWithSession(sessionId) {
	currentSessionId = sessionId
  if (!isDisconnecting) {
		connectWithCurrentSessionId();
	} else {
	  debug("waiting to connect with sessionId: " + currentSessionId);
		isWaitingToConnect = true;
	}
}

function connectWithCurrentSessionId() {
  debug("connecting with sessionId: " + currentSessionId);
  isWaitingToConnect = false;
	session = TB.initSession(currentSessionId);
	session.addEventListener('sessionConnected', sessionConnectedHandler);
	session.addEventListener('sessionDisconnected', sessionDisconnectedHandler);
	session.addEventListener('streamCreated', streamCreatedHandler);      
	session.connect(apiKey, token);
}

function disconnectCurrentSession() {
  if (session != null) {
	  debug("disconnecting..");
		isDisconnecting = true;
		session.disconnect();
	}
}

function sessionDisconnectedHandler (event) {
	isDisconnecting = false;
	if (isWaitingToConnect) {
		debug("was waiting to connect. Connecting after a disconnect with sessionId: " + currentSessionId);
		connectWithSession(currentSessionId);
	}
}

var publisher;

function sessionConnectedHandler(event) {
  insertReplaceElementInContent();
  publisher = session.publish(replaceElementId);
  publisher.publishAudio(false);

  // Subscribe to streams that were in the session when we connected
  subscribeToStreams(event.streams);
}

function insertReplaceElementInContent() {
	var replaceElementDiv = document.createElement('div');
	replaceElementDiv.setAttribute('id',replaceElementId);
	document.getElementById('content').appendChild(replaceElementDiv);
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
