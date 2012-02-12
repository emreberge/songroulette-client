function ServiceBase() {
	
	this.baseURL = getServiceHost();

	this.getServiceURL = function (service) {
		return this.baseURL.concat(service);
	}

	this.fetchURL = function (url, caller, callback) {
		var self = this;
		var http = this.getHTTPObject();
		console.log("url: " + url);
    http.open("GET",url,true);
		http.onreadystatechange = function(){
			if (http.readyState==4){
				console.log("http status: " + http.status + ", http.responseText: " + http.responseText);
					if (http.status==200){
							callback(http.responseText, caller);
            } else {
							self.errorCallback(http.statusText);
            }
        }
    }
    http.send(null);
	}
	
	this.errorCallback = function (statusText) {
		console.log("ERROR status: " + statusText);
	}
	
	this.getHTTPObject = function () {
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