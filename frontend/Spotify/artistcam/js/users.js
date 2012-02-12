var base = new Firebase('http://gamma.firebase.com/songroulette');
var userCallBackFunction;
var stalkedUserId;



function getUser(userID) {
    return  base.child('Users').child(userID); 
}


function startTrackingTrackOfUser(userID, trackChangedTo) {
    if(userCallBackFunction)
        stopTrackingUser();
        
    user = getUser(userID);
    userCallBackFunction = function(childSnapshot){
				var value = childSnapshot.val();
        if (value != null)
					trackChangedTo(value.track);
    };
    
    user.on('value', userCallBackFunction);
    stalkedUserId = userID;
}

function stopTrackingUser() {
    getUser(stalkedUserId).off('value', userCallBackFunction);
    userCallBackFunction = null;
}

function setMySong(myUserID, songID) {
    getUser(myUserID).set({track:songID});
}
