var base = new Firebase('http://gamma.firebase.com/songroulette');
var userCallBackFunctionMap = {}


function getUser(userID) {
    return  base.child('Users').child(userID); 
}


function startTrackingTrackOfUser(userID, trackChangedTo) {
    user = getUser(userID);
    userCallBackFunctionMap[userID] = function(childSnapshot){
        trackChangedTo(childSnapshot.val().track);
    };
    
    user.on('value', userCallBackFunctionMap[userID]);
}

function stopTrackingUser(userID) {
    getUser(userID).off('value', userCallBackFunctionMap[userID]);
    delete userCallBackFunctionMap[userID];
}

function setMySong(myUserID, songID) {
    getUser(myUserID).set({track:songID});
}
