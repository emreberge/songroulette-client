function AsyncSessionResolver(callback) {
	this.callback = callback;

	this.baseURL = "http://warm-samurai-3635.herokuapp.com";
	this.serviceBase = new ServiceBase();
	
	var sessionId = "";
	var token = "";
	var artistURI = "";

	this.sessionIdAndTokenWithArtistURI = function(_artistURI) {
			artistURI = _artistURI;
			this.sessionIdWithArtistURI(artistURI);
	}

	this.sessionIdWithArtistURI = function (artistURI) {
		var url = this.baseURL.concat("/" + artistURI + "/session" );
		this.serviceBase.fetchURL(url, this, this.sessionCallback);
	}

	this.sessionCallback = function (responseText, self) {
		console.log("sessionCallback with response: " + responseText);
		sessionId = responseText;
		self.tokenWithSessionId(sessionId);
	}

	this.tokenWithSessionId = function (sessionId) {
		var url = this.baseURL.concat("/" + sessionId + "/token" );
		this.serviceBase.fetchURL(url, this, this.tokenCallback);
	}

	this.tokenCallback = function (responseText, self) {
		token = responseText;
		fetching = false;
		self.callback(sessionId, token, artistURI);
	}

}
