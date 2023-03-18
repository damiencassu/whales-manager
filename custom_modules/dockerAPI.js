//Module in charge of docker engine API calls and wrapping

//Generic module loading
const HTTP = require("http");
const URL = require("url");
const EventEmitter = require("events").EventEmitter;

//Custom module loading
const ContainerNetwork = require("./containerNetwork");
const ContainerVolume = require("./containerVolume");
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
	//console.log(getContainerListURL);
        HTTP.get({socketPath: DOCKER_UNIX_SOCKET, path: getContainerListURL}, function(res){
		var data = "";				
		res.on("data", function(chunk){
			data += chunk;
		});

		res.on("end", function() {
			//console.log(data);
			apiResponseCallback(data);
		});

		res.on("error", function(err){
			console.log("ERROR : API Call failed : " + err.message);
		});
	});
}

//Test function
function test (){

	var testNetwork1 = new ContainerNetwork("10.70.10.40", "8888", "8989");
	var testNetwork2 = new ContainerNetwork("10.60.10.40", "7777", "7878");
	var testVolume1 = new ContainerVolume("/app1/", "/homeu1");
	var testVolume2 = new ContainerVolume("/app2/", "/homeu2");
	var listeNetworks = [testNetwork1, testNetwork2];
	var listeVolumes = [testVolume1, testVolume2];

	var testContainer = new Container ("7", "test", "image", "19/02/2023", "running", "12s", listeNetworks, listeVolumes);
	return testContainer;

}

module.exports.test = test;
module.exports.getContainerList = getContainerList;
 
