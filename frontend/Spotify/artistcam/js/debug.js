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