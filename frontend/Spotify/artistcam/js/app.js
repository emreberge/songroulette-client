sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var player = models.player;
var currentArtistURI;

exports.init = init;

function init() {

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
	debug("joining new room");
	var sessionResolver = new AsyncSessionResolver(sessionResolverHandler);
	sessionResolver.sessionIDAndTokenWithArtistURI(artistURI);
}

function sessionResolverHandler(sessionID, token, artistURI){
	if (currentArtistURI === artistURI) {
		doJoinRoom(sessionID, token);
	}
}

function doJoinRoom(sessionID, token) {
	leaveCurrentRoom();
	joinANewRoom(sessionID, token);
}

function leaveCurrentRoom() {
	disconnectCurrentSession();
}

function joinANewRoom(sessionID, token) {
	connectWithSessionAndToken(sessionID, token);
	startChat(sessionID,'Haxor');
}

function TrackServiceHandler() {
	this.didGetTrack = function (responseText) {
		console.log("didGetTrack with response: " + responseText);
	}

	this.didPutTrack = function (responseText) {
		console.log("didPutTrack with response: " + responseText);
	}
}
