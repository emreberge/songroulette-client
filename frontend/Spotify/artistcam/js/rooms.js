sp = getSpotifyApi(1);
var username = sp.core.user.canonicalUsername;
var base = new Firebase('http://gamma.firebase.com/songroulette');
var roomCallBackFunction;
var myUserID;
var myRoomID;

function getRoom(roomID) {
    return  base.child('Rooms').child(roomID); 
}


function startTrackingRoom(userID, roomID, roomChanged, trackId) {
    room = getRoom(roomID);
    roomCallBackFunction = function(childSnapshot){
        var value = childSnapshot.val();
        if (value != null)
            roomChanged(value);
    };
    
    room.on('value', roomCallBackFunction);
    myUserID = userID;
    myRoomID = roomID;
    songChanged(trackId);
}

function stopTrackingRoom() {
    room = getRoom(myRoomID);
    room.off('value', roomCallBackFunction);
    room.child(myUserID).remove();
}

function songChanged(trackId) {
    getRoom(myRoomID).child(myUserID).set({track:trackId, spotifyID:username});
}

