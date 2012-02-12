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
	startChat(session.sessionId,'Haxor');
	startTrackingTracks(session.sessionId, session.connection.connectionId);
}

function willLeaveRoom(session) {
  console.log("willLeaveRoom");
	console.log(session);
	stopChat(session.sessionId);
	endTrackingTracks(session.sessionId, session.connection.connectionId);
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

	this.willEndSession = function (session) {
		willLeaveRoom(session);    
	}

	this.didEstablishNewConnection = function (connection) {

	}

	this.didDestroyConnection = function (connection) {

	}
}