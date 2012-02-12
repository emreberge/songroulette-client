sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var player = models.player;

function debug (str) {
	window.opentokdebug.debug("[ArtistCam]: " + str);
}

function playTrack(uri)
{
    var tmpPlaylist = new models.Playlist();

    tmpPlaylist.add(uri);
    player.play(uri, tmpPlaylist.data.uri, 0);

}


function startStalking(spotifyUserId){
    startTrackingTrackOfUser(spotifyUserId, function(change){
                             playTrack(change);
                             });
}

function stopStalking(){
    stopTrackingUser();
    
}


var currentFollowState = null;


function stalk(spotifyUserId, key)
{
	console.log(key);
	if (key === currentFollowState) {
		stopStalking();
		currentFollowState = null;
		$('#stalk_' + key).attr('class', 'stalk');
	}
	else {
		$('#stalk_' + currentFollowState).attr('class', 'stalk');
		startStalking(spotifyUserId);
		currentFollowState = key;
		$('#stalk_' + key).attr('class', 'unstalk');
	}

	console.log(currentFollowState);
}