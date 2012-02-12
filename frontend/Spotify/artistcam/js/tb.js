
var apiKey = '11827222';
var currentSessionID = '';
var currentToken = '';
var session = null;
var replaceElementId = 'tokbox';
TB.setLogLevel(TB.DEBUG);

var isDisconnecting = false;
var isWaitingToConnect = false;
var isFullyConnected = false;

var sessionEventListener = null;

var currentConnections = [];

function setSessionEventListener(eventListener) {
	sessionEventListener = eventListener;
}

function getSession () {
	return session;
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
	session.addEventListener('streamDestroyed', streamDestroyedHandler);
	session.addEventListener('connectionCreated', connectionCreatedHandler);
	session.addEventListener('connectionDestroyed', connectionDestroyedHandler);
	session.connect(apiKey, currentToken);
}

function disconnectCurrentSession() {
  if (session != null) {
	  debug("disconnecting..");
		isDisconnecting = true;
		if (isFullyConnected)
			sessionEventListener.willEndSession(session, currentConnections);
		currentConnections = [];
		session.disconnect();
	}
	isFullyConnected = false;
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
	isFullyConnected = true;
	console.log(event);
  insertReplaceElementInContent();
  publisher = session.publish(replaceElementId);
  publisher.publishAudio(false);

  // Subscribe to streams that were in the session when we connected
  subscribeToStreams(event.streams);
	var _session = event.target;
	console.log("Started session");
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

		// Established connection
		var connection = streams[i].connection;
		var idx = indexOfConnectionInCurrentConnections(connection);
		if (idx === -1)
			currentConnections.push(connection);
		sessionEventListener.didEstablishNewConnection(connection);
  }
}

function streamDestroyedHandler(event) {
	console.log("stream destroyed");
	console.log(event);
	var streams = event.streams;
	console.log(streams);
	for (var i = 0; i < streams.length; i++) {
		var stream = streams[i];
		sessionEventListener.didDestroyConnection(stream.connection);
	}
}

function connectionCreatedHandler(event) {
	var connections = event.connections;
	for (var i = 0; i < connections.length; i++){
		var idx = indexOfConnectionInCurrentConnections(connection);
		if (idx === -1)
			currentConnections.push(connections[i]);
//		sessionEventListener.didEstablishNewConnection(connection);
	}
}

function indexOfConnectionInCurrentConnections(connection) {
	var conId = connection.connectionId;
	for (var j = 0; j < currentConnections.length; j++) {
		var conId2 = currentConnections[j].connectionId;
		if (conId === conId2) {
			return j;
		}
	}
	return -1;
}

function connectionDestroyedHandler(event) {
  var connections = event.connections;
	for (var i = 0; i < connections.length; i++){
		var connection = connections[i];
		var idx = indexOfConnectionInCurrentConnections(connection);
		if (idx != -1)
			currentConnections.splice(idx, 1);
		else
			console.log("WARN: connection was not in current connections");
//		sessionEventListener.didDestroyConnection(connection);
		removeDivForConnection(connection);
	}
}

function removeDivForConnection(connection) {
  var c = document.getElementById('content');
  var divId = document.getElementById(connection.connectionId);
  c.removeChild(divId);
}
