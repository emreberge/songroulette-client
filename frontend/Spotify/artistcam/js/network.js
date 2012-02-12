function AsyncSessionResolver(callback) {
	this.callback = callback;

	this.baseURL = "http://warm-samurai-3635.herokuapp.com";
	
	var sessionId = "";
	var token = "";
	var artistURI = "";

	this.sessionIdAndTokenWithArtistURI = function(_artistURI) {
			artistURI = _artistURI;
			this.sessionIdWithArtistURI(artistURI);
	}

	this.sessionIdWithArtistURI = function (artistURI) {
		var url = this.baseURL.concat("/" + artistURI + "/session" );
		this.fetchURL(url, this.sessionCallback);
	}

	this.sessionCallback = function (responseText, self) {
		console.log("sessionCallback with response: " + responseText);
		sessionId = responseText;
		self.tokenWithSessionId(sessionId);
	}

	this.tokenWithSessionId = function (sessionId) {
		var url = this.baseURL.concat("/" + sessionId + "/token" );
		this.fetchURL(url, this.tokenCallback);
	}

	this.tokenCallback = function (responseText, self) {
		token = responseText;
		fetching = false;
		self.callback(sessionId, token, artistURI);
	}

	this.errorCallback = function (statusText) {
		console.log("ERROR status: " + statusText);
	}

	this.fetchURL = function (url, callback) {
		var self = this;
		var http = getHTTPObject();
		console.log("url: " + url);
    http.open("GET",url,true);
		http.onreadystatechange = function(){
			if (http.readyState==4){
				console.log("http status: " + http.status + ", http.responseText: " + http.responseText);
					if (http.status==200){
							callback(http.responseText, self);
            } else {
							self.errorCallback(http.statusText);
            }
        }
    }
    http.send(null);
	}

	function getHTTPObject() {
    if (typeof XMLHttpRequest != 'undefined') {
        return new XMLHttpRequest();
    }
    try {
        return new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
        try {
            return new ActiveXObject("Microsoft.XMLHTTP");
        } catch (e) {}
    }
    return false;
	}

}
