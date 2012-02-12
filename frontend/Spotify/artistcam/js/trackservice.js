function AsyncTrackService(trackServiceHandler) {
	this.trackServiceHandler = trackServiceHandler;
	
	this.serviceBase = new ServiceBase();
	
	this.getTrackForUserID = function (userID) {
		var url = this.serviceBase.getServiceURL("/" + userID + "/track");
		this.serviceBase.fetchURL(url, this, getTrackCallback);
	}
	
	this.getTrackCallback = function(responseText, self) {
		self.trackServiceHandler.didGetTrack(responseText);
	}
	
	this.putTrackForUserIDWithTrack = function (userID, track) {
		var url = this.serviceBase.getServiceURL("/" + userID + "/track/" + track);
		this.serviceBase.fetchURL(url, this, putTrackCallback);
	}
	
	this.putTrackCallback = function(responseText, self) {
		self.trackServiceHandler.didPutTrack(responseText);
	}	
}