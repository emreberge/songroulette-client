sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var player = models.player;
var currentArtistURI;

exports.init = init;

function init() {
	setSessionEventListener(new SessionEventListener());
	updatePageWithTrackDetails();

	player.observe(models.EVENT.CHANGE, function (e) {

			// Only update the page if the track changed
			if (e.data.curtrack == true) {
					updatePageWithTrackDetails();
			}
	});
}

function updatePageWithTrackDetails() {
	var header = document.getElementById('artist');

	var isPlayingTrack = player.track != null;

	if (isPlayingTrack) {
		updateMyTrack();
		var track = getTrack();
		var artist = track.artists[0];
		if (currentArtistURI != artist.uri){
			currentArtistURI = artist.uri;
			joinRoomForArtistURI(artist.uri);
		}
		header.innerHTML = "People listening to " + artist.name;
	} else {
			header.innerText = "Start playing to see other people liste	ning to the same artist as you!";
	}
}

function updateMyTrack() {
	var session = getSession();
	if(session){
		var connection = session.connection;
		if (connection) {
			songChanged(getTrack().uri);
		}
	}
}

function getTrack() {
	return player.track.data;
}

var currentArtistURI;

function joinRoomForArtistURI(artistURI){
	var sessionResolver = new AsyncSessionResolver(sessionResolverHandler);
	sessionResolver.sessionIDAndTokenWithArtistURI(artistURI);
}

function sessionResolverHandler(sessionID, token, artistURI){
	if (currentArtistURI === artistURI) {
		doJoinRoom(sessionID, token);
	}
}

function doJoinRoom(sessionID, token) {
	leaveCurrentRoom(sessionID);
	joinANewRoom(sessionID, token);
}

function leaveCurrentRoom(sessionID) {
	disconnectCurrentSession();
}

function joinANewRoom(sessionID, token) {
	connectWithSessionAndToken(sessionID, token);
}

function didJoinANewRoom(session) {
	console.log("didJoinANewRoom");
	console.log(session);
	startChat(currentArtistURI,'Haxor');
	startTrackingRoom(session.connection.connectionId, currentArtistURI, onRoomChange, getTrack().uri);
	updateMyTrack();
}

function onRoomChange (value) {
	console.log(value);
}

function onTrackChangedHandler(track) {
	console.log("OMG THIS IS NOT IMPLEMENTED! WHAT ARGUMENTS SHULD I TKE? Look in users.js");
}

function willLeaveRoom(session) {
  console.log("willLeaveRoom");
	console.log(session);
	stopChat(currentArtistURI);
	stopTrackingRoom();
}


function TrackServiceHandler() {
	this.didGetTrack = function (responseText) {
		console.log("didGetTrack with response: " + responseText);
	}

	this.didPutTrack = function (responseText) {
		console.log("didPutTrack with response: " + responseText);
	}
}

function SessionEventListener() {
	this.didStartSession = function (session) {
		didJoinANewRoom(session);
	}

	this.willEndSession = function (session, connections) {
		willLeaveRoom(session);
		for (var i = 0; i < connections.length; i++)
			stopTrackingUser(connections[i].connectionId);
	}

	this.didEstablishNewConnection = function (connection) {
		console.log(connection);
		startTrackingTrackOfUser(connection.connectionId, onTrackChangedHandler);
	}

	this.didDestroyConnection = function (connection) {
		stopTrackingUser(connection.connectionId);
	}
}