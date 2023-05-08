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
const DOCKER_API_START_CONTAINER_URI = "/containers/{id}/start";
const DOCKER_API_STOP_CONTAINER_URI = "/containers/{id}/stop";
const DOCKER_API_RESTART_CONTAINER_URI ="/containers/{id}/restart";
const DOCKER_API_INFO_CONTAINER_URI = "/containers/{id}/json";

//Function which retrieves the list of containers managed by the local docker engine
/*
 * all: retrieve all containers (TRUE) or only running ones (FALSE)
 * dockerApiVersion: the version of the docker server api to connect to using X.X.X format
 * callback function which takes
 * 	a boolean error value set to true if an error occured, false otherwise 
 * 	a data object containing the raw JSON list of containers returned by docker API (if no error only) 
 */
function getContainerList (all, dockerApiVersion, callback, logger){
	
	var getContainerListURL = new URL.URL("/v" + dockerApiVersion + DOCKER_API_LIST_CONTAINER_URI, DOCKER_API_BASE);
	getContainerListURL.search = "all=" + all;

	if (logger != undefined){
        	logger.debug("dockerapi", "Calling Docker API on: " + getContainerListURL);
        }

        HTTP.get({socketPath: DOCKER_UNIX_SOCKET, path: getContainerListURL}, function(res){

		if (res.statusCode == 200){
			
			if (logger != undefined){
                        	logger.debug("dockerapi", "Call to Docker API succeeded on: " + getContainerListURL);
	                }

			var data = "";				
			res.on("data", function(chunk){
				data += chunk;
			});

			res.on("end", function() {
				callback(false, data);
			});

			res.on("error", function(err){

				if (logger != undefined){
                			logger.error("dockerapi", "Call to Docker API failed on: " + getContainerListURL + " with: " + err.message);
        			}
				callback(true);
			});

		} else {

			var data = "";
                        res.on("data", function(chunk){
                                data += chunk;
                        });

                        res.on("end", function() {

				if (logger != undefined){
                                	logger.error("dockerapi", "Call to Docker API failed on: " + getContainerListURL + " with: " + data);
                        	}
                                callback(true);
                        });

                        res.on("error", function(err){

                                if (logger != undefined){
                                        logger.error("dockerapi", "Call to Docker API failed on: " + getContainerListURL + " with: " + err.message);
                                }
				callback(true);
                        });
		}
	});
}


//Function which retrieves the detailed information of the container with the given ID
/*
 * id: sanitized ID of the container to retrieve info from
 * dockerApiVersion: the version of the docker server api to connect to using X.X.X format
 * callback function which takes
 * 	a boolean error value set to true if an error occured, false otherwise
 * 	a data object containing the raw JSON container returned by docker API (if no error only)
 */
function getContainerInfo (id, dockerApiVersion, callback, logger){

	var getContainerInfoURL = new URL.URL("/v" + dockerApiVersion + DOCKER_API_INFO_CONTAINER_URI.replace("{id}", id), DOCKER_API_BASE);
        if (logger != undefined){
                logger.debug("dockerapi", "Calling Docker API on: " + getContainerInfoURL);
        }

	HTTP.get({socketPath: DOCKER_UNIX_SOCKET, path: getContainerInfoURL}, function(res){

                if (res.statusCode == 200){

                        if (logger != undefined){
                                logger.debug("dockerapi", "Call to Docker API succeeded on: " + getContainerInfoURL);
                        }

                        var data = "";
                        res.on("data", function(chunk){
                                data += chunk;
                        });

                        res.on("end", function() {
                                callback(false, data);
                        });

                        res.on("error", function(err){

                                if (logger != undefined){
                                        logger.error("dockerapi", "Call to Docker API failed on: " + getContainerInfoURL + " with: " + err.message);
                                }
                                callback(true);
                        });

                } else {

                        var data = "";
                        res.on("data", function(chunk){
                                data += chunk;
                        });

                        res.on("end", function() {

                                if (logger != undefined){
                                        logger.error("dockerapi", "Call to Docker API failed on: " + getContainerInfoURL + " with: " + data);
                                }
                                callback(true);
                        });

                        res.on("error", function(err){

                                if (logger != undefined){
                                        logger.error("dockerapi", "Call to Docker API failed on: " + getContainerInfoURL + " with: " + err.message);
                                }
                                callback(true);
                        });
                }
        });
}

//Function which starts the container with the given ID
/*
 * id: sanitized ID of the container to start
 * dockerApiVersion: the version of the docker server api to connect to using X.X.X format
 * callback function which takes a result object containing the formated start result
 *  error: boolean telling if an error has been reported by Docker Server API - started and already started are considered as success results
 *  unknown : boolean telling if the targeted container is known by Docker Server
 *  started : bollean telling if the targeted container has been started or not
 */
function startContainer (id, dockerApiVersion, callback, logger){

	var startContainerURL = new URL.URL("/v" + dockerApiVersion + DOCKER_API_START_CONTAINER_URI.replace("{id}", id), DOCKER_API_BASE);
	if (logger != undefined){
		logger.debug("dockerapi", "Calling Docker API on: " + startContainerURL);
	}
	
	var postRequest = HTTP.request({socketPath: DOCKER_UNIX_SOCKET, method: "POST",path: startContainerURL}, function(res){

		if (res.statusCode == 304){
			//Container already started
			if (logger != undefined){
				logger.debug("dockerapi", "Call to Docker API succeeded on: " + startContainerURL + " - container " + id + " already started");
			}

			callback({error: false, unknown: false, started: false});

		} else if (res.statusCode == 204) {
			//Container started
                	if (logger != undefined){
				logger.debug("dockerapi", "Call to Docker API succeeded on: " + startContainerURL + " - container " + id + " started");
			}

			callback({error: false, unknown: false, started: true});

		} else if (res.statusCode == 404) {
			//Container not found
			var data = "";
			res.on("data", function(chunk){
				data += chunk;
			});

			res.on("end", function() {
				if (logger != undefined){
				        logger.debug("dockerapi", "Call to Docker API succeeded on: " + startContainerURL + " - container " + id + " not found");
				}
			   	callback({error: true, unknown: true, started: false});
			});

			res.on("error", function(err){
	                	if (logger != undefined){
		                	logger.error("dockerapi", "Call to Docker API failed on: " + startContainerURL + " with: " + err.message);
		        	}
				callback({error: true, unknown: false, started: false});
			});

		} else {
			//Internal server error
			var data = "";
	                res.on("data", function(chunk){
		                data += chunk;
		        });

		        res.on("end", function() {
			        if (logger != undefined){
				        logger.debug("dockerapi", "Call to Docker API failed on: " + startContainerURL + " - internal error - " + JSON.parse(data).message);
				}
				callback({error: true, unknown: false, started: false});
			});

			res.on("error", function(err){
				if (logger != undefined){
					logger.error("dockerapi", "Call to Docker API failed on: " + startContainerURL + " with: " + err.message);
			        }
				callback({error: true, unknown: false, started: false});
			});
		}	
        });

	postRequest.end();
}	

//Function which stops the container with the given ID
/*
 * id: sanitized ID of the container to stop
 * dockerApiVersion: the version of the docker server api to connect to using X.X.X format
 * callback function which takes a result object containing the formated stop result
 *  error: boolean telling if an error has been reported by Docker Server API - stopped and already stopped are considered as success results
 *  unknown : boolean telling if the targeted container is known by Docker Server
 *  stopped : bollean telling if the targeted container has been stopped or not
 */
function stopContainer (id, dockerApiVersion, callback, logger){

	var stopContainerURL = new URL.URL("/v" + dockerApiVersion + DOCKER_API_STOP_CONTAINER_URI.replace("{id}", id), DOCKER_API_BASE);
	if (logger != undefined){
		logger.debug("dockerapi", "Calling Docker API on: " + stopContainerURL);
	}
	
	var postRequest = HTTP.request({socketPath: DOCKER_UNIX_SOCKET, method: "POST",path: stopContainerURL}, function(res){

		if (res.statusCode == 304){
			//Container already stopped
			if (logger != undefined){
				logger.debug("dockerapi", "Call to Docker API succeeded on: " + stopContainerURL + " - container " + id + " already stopped");
			}

			callback({error: false, unknown: false, stopped: false});

		} else if (res.statusCode == 204) {
			//Container stopped
			if (logger != undefined){
				logger.debug("dockerapi", "Call to Docker API succeeded on: " + stopContainerURL + " - container " + id + " stopped");
			}

			callback({error: false, unknown: false, stopped: true});
			
		} else if (res.statusCode == 404) {
			//Container not found
			var data = "";
			res.on("data", function(chunk){
				data += chunk;
			});

			res.on("end", function() {
				if (logger != undefined){
				        logger.debug("dockerapi", "Call to Docker API succeeded on: " + stopContainerURL + " - container " + id + " not found");
				}
			   	callback({error: true, unknown: true, stopped: false});
			});

			res.on("error", function(err){
	                	if (logger != undefined){
		                	logger.error("dockerapi", "Call to Docker API failed on: " + stopContainerURL + " with: " + err.message);
		        	}
				callback({error: true, unknown: false, stopped: false});
			});

		} else {
			//Internal server error
			var data = "";
	                res.on("data", function(chunk){
		                data += chunk;
		        });

		        res.on("end", function() {
			        if (logger != undefined){
				        logger.debug("dockerapi", "Call to Docker API failed on: " + stopContainerURL + " - internal error - " + JSON.parse(data).message);
				}
				callback({error: true, unknown: false, stopped: false});
			});

			res.on("error", function(err){
				if (logger != undefined){
					logger.error("dockerapi", "Call to Docker API failed on: " + stopContainerURL + " with: " + err.message);
			        }
				callback({error: true, unknown: false, stopped: false});
			});
		}	
        });

	postRequest.end();
}	

//Function which restarts the container with the given ID
/*
 * id: sanitized ID of the container to restart
 * dockerApiVersion: the version of the docker server api to connect to using X.X.X format
 * callback function which takes a result object containing the formated restart result
 *  error: boolean telling if an error has been reported by Docker Server API - restarted is considered as success result
 *  unknown : boolean telling if the targeted container is known by Docker Server
 *  restarted : bollean telling if the targeted container has been restarted or not
 */
function restartContainer (id, dockerApiVersion, callback, logger){

	var restartContainerURL = new URL.URL("/v" + dockerApiVersion + DOCKER_API_RESTART_CONTAINER_URI.replace("{id}", id), DOCKER_API_BASE);
	if (logger != undefined){
		logger.debug("dockerapi", "Calling Docker API on: " + restartContainerURL);
	}
	
	var postRequest = HTTP.request({socketPath: DOCKER_UNIX_SOCKET, method: "POST",path: restartContainerURL}, function(res){

		if (res.statusCode == 204) {
			//Container restarted
			if (logger != undefined){
				logger.debug("dockerapi", "Call to Docker API succeeded on: " + restartContainerURL + " - container " + id + " restarted");
			}

			callback({error: false, unknown: false, restarted: true});

		} else if (res.statusCode == 404) {
			//Container not found
			var data = "";
			res.on("data", function(chunk){
				data += chunk;
			});

			res.on("end", function() {
				if (logger != undefined){
				    logger.debug("dockerapi", "Call to Docker API succeeded on: " + restartContainerURL + " - container " + id + " not found");
				}
			   	callback({error: true, unknown: true, restarted: false});
			});

			res.on("error", function(err){
	                if (logger != undefined){
						logger.error("dockerapi", "Call to Docker API failed on: " + restartContainerURL + " with: " + err.message);
					}
				callback({error: true, unknown: false, restarted: false});
			});

		} else {
			//Internal server error
			var data = "";
	                res.on("data", function(chunk){
		                data += chunk;
		        });

		        res.on("end", function() {
			        if (logger != undefined){
				        logger.debug("dockerapi", "Call to Docker API failed on: " + restartContainerURL + " - internal error - " + JSON.parse(data).message);
					}
				callback({error: true, unknown: false, restarted: false});
			});

			res.on("error", function(err){
				if (logger != undefined){
					logger.error("dockerapi", "Call to Docker API failed on: " + restartContainerURL + " with: " + err.message);
			        }
				callback({error: true, unknown: false, restarted: false});
			});
		}	
        });

	postRequest.end();
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
		try {
			var apiVersion = JSON.parse(CP.execSync("docker version --format '{{json .Server.APIVersion}}'"));
                	if (logger != undefined){
                        	logger.debug("dockerapi", "Detecting Docker server API version: " + apiVersion);
                	}
			return apiVersion;
		} catch (err) {
			return undefined;
		}
	}
}

//Export section
module.exports.getContainerList = getContainerList;
module.exports.getDockerAPIVersion = getDockerAPIVersion;
module.exports.startContainer = startContainer;
module.exports.stopContainer = stopContainer;
module.exports.restartContainer = restartContainer;
module.exports.getContainerInfo = getContainerInfo;
