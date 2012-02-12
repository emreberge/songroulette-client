function AsyncSessionResolver(callback) {
	this.callback = callback;

	this.baseURL = getServiceHost();
	this.serviceBase = new ServiceBase();
	
	var sessionID = "";
	var token = "";
	var artistURI = "";

	this.sessionIDAndTokenWithArtistURI = function(_artistURI) {
			artistURI = _artistURI;
			this.sessionIDWithArtistURI(artistURI);
	}

	this.sessionIDWithArtistURI = function (artistURI) {
		var url = this.baseURL.concat("/" + artistURI + "/session" );
		this.serviceBase.fetchURL(url, this, this.sessionCallback);
	}

	this.sessionCallback = function (responseText, self) {
		console.log("sessionCallback with response: " + responseText);
		sessionID = responseText;
		self.tokenWithsessionID(sessionID);
	}

	this.tokenWithsessionID = function (sessionID) {
		var url = this.baseURL.concat("/" + sessionID + "/token" );
		this.serviceBase.fetchURL(url, this, this.tokenCallback);
	}

	this.tokenCallback = function (responseText, self) {
		token = responseText;
		fetching = false;
		self.callback(sessionID, token, artistURI);
	}

}
