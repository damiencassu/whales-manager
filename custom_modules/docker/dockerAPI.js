//Module in charge of docker engine API calls and wrapping

//Generic module loading
const HTTP = require("node:http");
const URL = require("node:url");
const CP = require("node:child_process");

//Custom module loading
const LOGGER_SYS = require("../core/logger");

//Program constants
const DOCKER_UNIX_SOCKET = "/var/run/docker.sock";
const DOCKER_API_BASE = "http://localhost/";
const DOCKER_API_LIST_CONTAINER_URI = "/containers/json";

//Function which retrieves the list of containers managed by the local docker engine
/*
 * all: retrieve all containers (TRUE) or only running ones (FALSE)
 * dockerApiVersion: the version of the docker server api to connect to using X.X.X format
 * callback function which takes a data object containing the raw JSON list of containers returned by docker API 
 */
function getContainerList (all, dockerApiVersion, callback, logger){
	
	var getContainerListURL = new URL.URL("/v" + dockerApiVersion + DOCKER_API_LIST_CONTAINER_URI, DOCKER_API_BASE);
	getContainerListURL.search = "all=" + all;

	if (logger != undefined){
        	logger.debug("dockerapi", "Calling Docker API on: " + getContainerListURL);
        }

        HTTP.get({socketPath: DOCKER_UNIX_SOCKET, path: getContainerListURL}, function(res){
		var data = "";				
		res.on("data", function(chunk){
			data += chunk;
		});

		res.on("end", function() {
			callback(data);
		});

		res.on("error", function(err){

			if (logger != undefined){
                		logger.error("dockerapi", "Call to Docker API failed on: " + getContainerListURL + " with: " + err.message);
        		}
		});
	});
}

//Function which automatically detects docker server API version
/*
 * dockerized: boolean set to true is process is dockerized, false if not
 */
function getDockerAPIVersion (dockerized, logger){

	//If running in docker, read environment variable
	if (dockerized){
		var apiVersion = process.env.DOCKER_API_VERSION;
		if (logger != undefined){
                        logger.debug("dockerapi", "Detecting Docker server API version: " + apiVersion);
                }
		return apiVersion;	
	} else {
	//Else check directly on the host
		var apiVersion = JSON.parse(CP.execSync("docker version --format '{{json .Server.APIVersion}}'"));
                if (logger != undefined){
                        logger.debug("dockerapi", "Detecting Docker server API version: " + apiVersion);
                }
		return apiVersion;	
	}
}

//Export section
module.exports.getContainerList = getContainerList;
module.exports.getDockerAPIVersion = getDockerAPIVersion; 
