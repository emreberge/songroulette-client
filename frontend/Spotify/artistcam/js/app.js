sp = getSpotifyApi(1);
var username = sp.core.user.canonicalUsername;
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
			header.innerText = "Start playing to see other people listening to the same artist as you!";
	}
}

function updateMyTrack() {
	var session = getSession();
	if(session){
		var connection = session.connection;
		if (connection) {
			songChanged(getTrack().uri);
			setMySong(username, getTrack().uri);
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

var isFirstTime = true;

function doJoinRoom(sessionID, token) {
	if(!isFirstTime)
		leaveCurrentRoom();
	else
		isFirstTime = false;
	joinANewRoom(sessionID, token);
}
 
function leaveCurrentRoom() {
	disconnectCurrentSession();
	stopChat(currentArtistURI);
	stopTrackingRoom();
}

function joinANewRoom(sessionID, token) {
	connectWithSessionAndToken(sessionID, token);
}

function didJoinANewRoom(session) {
	console.log("didJoinANewRoom");
	console.log(session);
	startChat(currentArtistURI, username);
	startTrackingRoom(session.connection.connectionId, currentArtistURI, onRoomChange, getTrack().uri);
	updateMyTrack();
}

function onRoomChange (value) {
    console.log(value);

	for (var key in value) {
        var t = models.Track.fromURI(value[key].track, function(v) {

            var play = "<div class=\"play\"><a href=\"#\"onclick=\"javascript:playTrack('"+value[key].track+"');\"><img src=\"img/play.png\" style=\"vertical-align: middle; padding: 3px;\"/> " + v.name + "</a></div>";

            $('#' + key).find('.info').html(play);
        });
        
        var stalk = "<button onclick=\"javascript:startStalking('"+value[key].spotifyID+"');\">test</button>";
        
//console.log(stalk);
        $('#stalk_' + key).html(stalk);
        
    }
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

	this.willEndSession = function (session) {
		willLeaveRoom(session);
	}

	this.newConnectionEstablished = function (session) {
		updateMyTrack();
	}
}