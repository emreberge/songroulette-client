
var apiKey = '11827222';
var currentSessionID = '';
var currentToken = '';
var session = null;
var replaceElementId = 'tokbox';
TB.setLogLevel(TB.DEBUG);

var isDisconnecting = false;
var isWaitingToConnect = false;

var sessionEventListener = null;

function setSessionEventListener(eventListener) {
	sessionEventListener = eventListener;
}

function connectWithSessionAndToken(sessionID, token) {
	currentSessionID = sessionID
	currentToken = token;
  if (!isDisconnecting) {
		connectWithCurrentSessionID();
	} else {
	  debug("waiting to connect with sessionID: " + currentSessionID);
		isWaitingToConnect = true;
	}
}

function connectWithCurrentSessionID() {
  debug("connecting with sessionID: " + currentSessionID);
  isWaitingToConnect = false;
	session = TB.initSession(currentSessionID);
	session.addEventListener('sessionConnected', sessionConnectedHandler);
	session.addEventListener('sessionDisconnected', sessionDisconnectedHandler);
	session.addEventListener('streamCreated', streamCreatedHandler);
	session.addEventListener('connectionCreated', connectionCreatedHandler);
	session.addEventListener('connectionDestroyed', connectionDestroyedHandler);
	session.connect(apiKey, currentToken);
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
	removeEverythingInContentDivAfterDisconnect();
	if (isWaitingToConnect) {
		debug("was waiting to connect. Connecting after a disconnect with sessionID: " + currentSessionID);
		connectWithSessionAndToken(currentSessionID, currentToken);
	}
}

function removeEverythingInContentDivAfterDisconnect() {
	var c = document.getElementById('content');

  if (c.hasChildNodes()) {
    while (c.childNodes.length >= 1) {
     c.removeChild(c.firstChild);
    }
  }
}

var publisher;

function sessionConnectedHandler(event) {
	console.log(event);
  insertReplaceElementInContent();
  publisher = session.publish(replaceElementId);
  publisher.publishAudio(false);

  // Subscribe to streams that were in the session when we connected
  subscribeToStreams(event.streams);
	var _session = event.target;
	console.log(_session);
	if (sessionEventListener === null)
		console.log("Warning: sessionEventListener is null. Use setSessionEventListener and listen!");
	else
		sessionEventListener.didStartSession(_session);
}

function insertReplaceElementInContent() {
	var boxDiv = document.createElement('div');
	boxDiv.setAttribute('id', 'you');
	boxDiv.setAttribute('class', 'box');
	
	var tokboxDiv = document.createElement('div');
	tokboxDiv.setAttribute('id',replaceElementId);
	
	var infoDiv = document.createElement('div');
	infoDiv.setAttribute('class', 'info');
	
	boxDiv.appendChild(tokboxDiv);
	boxDiv.appendChild(infoDiv);
	document.getElementById('content').appendChild(boxDiv);
}
 
function streamCreatedHandler(event) {
	// Subscribe to any new streams that are created
	subscribeToStreams(event.streams);
}
 
function subscribeToStreams(streams) {
  for (var i = 0; i < streams.length; i++) {
    // Make sure we don't subscribe to ourself
    if (streams[i].connection.connectionId === session.connection.connectionId) {
      return;
    }

    var id = streams[i].streamId;

    // Create the div to put the subscriber element in to
    var box = document.createElement('div');
    box.setAttribute('class', 'box');
    box.setAttribute('id', streams[i].connection.connectionId);
    document.getElementById('content').appendChild(box);

    var cam = document.createElement('div');
    cam.setAttribute('id', 'stream' + id);
    document.getElementById(streams[i].connection.connectionId).appendChild(cam);
                       
    // Subscribe to the stream
    session.subscribe(streams[i], cam.id);
  }
}

function connectionCreatedHandler(event) {

}

function connectionDestroyedHandler(event) {
  console.log(event)
  var c = document.getElementById('content');
  var divId = document.getElementById(event.connections[0].connectionId);
  c.removeChild(divId);
}
