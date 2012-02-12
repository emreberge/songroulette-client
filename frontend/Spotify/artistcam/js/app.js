sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var player = models.player;
var currentArtistURI;

exports.init = init;

var sessionResolver = new SessionResolver();

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

    // This will be null if nothing is playing.
    var playerTrackInfo = player.track;

    if (playerTrackInfo == null) {
        header.innerText = "Start playing to see other people liste	ning to the same artist as you!";
    } else {
        var track = playerTrackInfo.data;
				var artist = track.album.artist;
				debug("currentArtistURI: " + currentArtistURI + ", artist.uri: " + artist.uri);
				if (currentArtistURI != artist.uri){
					joinRoomForArtistURI(artist.uri);
				}
				currentArtistURI = artist.uri;
        header.innerHTML = "People listening to " + artist.name;
    }
}

function joinRoomForArtistURI(artistURI){
	disconnectCurrentSession();
	debug("joining new room");
	sessionResolver.sessionIdWithArtistURI(artistURI);
	//var token = sessionResolver.tokenWithSessionId(sessionId);
	//connectWithSession(sessionId);
}
