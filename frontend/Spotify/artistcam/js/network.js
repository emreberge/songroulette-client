function SessionResolver() {

	this.xmlHttpRequest = new XMLHttpRequest();
	
	this.baseURL = "http://host:port/request";
	
	this.resolveSessionIdForArtistURI = function (artistURI) {
		var url = this.baseURL.concat("/" + artistURI);
		this.fetchURL(url);
	}
	
	this.resolveTokenWithSessionId = function (sessionId) {
		var url = this.baseURL.concat("/" + sessionId);
		this.fetchURL(url);
	}
	
	this.fetchURL = function (url) {
		var self = this;
		this.xmlHttpRequest.onreadystatechange = function(){
        if (self.xmlHttpRequest.readyState==4){
            if (self.xmlHttpRequest.status==200){
                self.onRetrieveSuccess.call(self,self.xmlhttp.responseText);
            }else{
                self.onRetrieveError.call(self,self.xmlhttp.statusText);
            }
        }
    }
    this.xmlHttpRequest.open("GET",url,true);
    this.xmlHttpRequest.send(null);
	}

	/*
	* The method called when a resource is successfully retrieved.
	*/
	this.onRetrieveSuccess = function(responseText){
			alert("onRetrieveSuccess method "+responseText);
	}
 
	/*
	* The method called when a resource is not created.
	*/
	this.onRetrieveError = function(statusText){
			alert("onRetrieveError method "+statusText);
	}
 

}
