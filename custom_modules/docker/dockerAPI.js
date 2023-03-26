//Module in charge of docker engine API calls and wrapping

//Generic module loading
const HTTP = require("node:http");
const URL = require("node:url");

//Custom module loading
const Container = require("./container");

//Program constants
const DOCKER_UNIX_SOCKET = "/var/run/docker.sock";
const DOCKER_API_VERSION = "/v1.41";
const DOCKER_API_BASE = "http://localhost/";
const DOCKER_API_LIST_CONTAINER_URI = "/containers/json";

//Function which retrieves the list of containers managed by the local docker engine
/*
    all: retrieve all containers (TRUE) or only running ones (FALSE)
    apiResponseCallback: callback function which handles detected containers raw JSON list returned by docker API 
*/
function getContainerList (all, apiResponseCallback){
	var getContainerListURL = new URL.URL(DOCKER_API_VERSION + DOCKER_API_LIST_CONTAINER_URI, DOCKER_API_BASE);
	getContainerListURL.search = "all=" + all;
        HTTP.get({socketPath: DOCKER_UNIX_SOCKET, path: getContainerListURL}, function(res){
		var data = "";				
		res.on("data", function(chunk){
			data += chunk;
		});

		res.on("end", function() {
			apiResponseCallback(data);
		});

		res.on("error", function(err){
			console.log("ERROR : API Call failed : " + err.message);
		});
	});
}

//Export section
module.exports.getContainerList = getContainerList;
 
