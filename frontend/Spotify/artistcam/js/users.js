var base = new Firebase('http://gamma.firebase.com/songroulette');

function getUser(userID) {
    return  base.child('Users').child(userID); 
}


function startTrackingTrackOfUser(userID, trackChanged) {
    
}

function stopTrackingUser(userID) {

}
