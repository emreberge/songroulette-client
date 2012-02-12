function SessionResolver() {
	
	this.baseURL = "http://warm-samurai-3635.herokuapp.com";
	
	this.sessionIdWithArtistURI = function (artistURI) {
		var url = this.baseURL.concat("/sessionID/" + artistURI);
		this.fetchSessionURL(url);
	}
	
	this.tokenWithSessionId = function (sessionId) {
		var url = this.baseURL.concat("/token/" + sessionId);
		//this.fetchTokenURL(url);
	}
	
	this.fetchSessionURL = function (url) {
		var self = this;
		var http = getHTTPObject();
		console.log("url: " + url);
    http.open("GET",url,true);
		http.onreadystatechange = function(){
        if (http.readyState==4){
					console.log("http status: " + http.status + ", http.responseText: " + http.responseText);
            if (http.status==200){
                connectWithSession(http.responseText);
            }else{
                self.onRetrieveSessionError(self,http.statusText);
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
