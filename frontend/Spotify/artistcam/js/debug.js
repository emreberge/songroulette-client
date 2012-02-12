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