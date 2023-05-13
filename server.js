//Generic module loading
const EXPRESS = require("express");
const HTTP = require("node:http");
const HTTPS = require("node:https");
const LOGGER_HTTP = require("morgan");
const FS = require("node:fs");
const PATH = require("node:path");

//Custom module loading
const DOCKER_API = require("./custom_modules/docker/dockerAPI");
const CORE = require("./custom_modules/core/core");
const CONTAINER = require("./custom_modules/docker/container");
const LOGGER_SYS = require("./custom_modules/core/logger");

//Log related program constants
const LOG_DIR = "logs";
const LOG_FORMAT_HTTP = "common";
const LOG_FILE_ACCESS = "access.log";
const LOG_FILE_SYS = "server.log";

//Create Logger for system events
var sysLogger = new LOGGER_SYS("info", PATH.join(__dirname, LOG_DIR, LOG_FILE_SYS));
sysLogger.info("server", "########## Whales Manager starting... ##########");

//TLS options for HTTPS handling
var tlsOptions = {enable: false, key: "", cert: ""};

//Other program constants
var startupError = false;

//Loading APP Config values
const APP_CONFIG = CORE.loadConfigFile("./conf/server.json");
if (APP_CONFIG != undefined) {
	sysLogger.info("server", "Config file detected and successfully loaded, applying custom values");

	//Checking config for debug level
	if (APP_CONFIG.debugLevel != undefined) {
		sysLogger.logLevel = APP_CONFIG.debugLevel;
		sysLogger.info("server", "Debug level set to " + sysLogger.logLevel.toUpperCase() + " (custom)");
	} else {
		sysLogger.warn("server", "No debug level property found in server.json, debug level set to INFO (default)");
	}

	//Checking config for https
	if (APP_CONFIG.https != undefined) {
		if (APP_CONFIG.https.enabled){
			tlsOptions.enable = true;
			sysLogger.info("server", "HTTPS mode enabled (custom)");
			if (APP_CONFIG.https.key != undefined && APP_CONFIG.https.cert != undefined) {
				
				//Try to load private key for https
				try {

        				tlsOptions.key = FS.readFileSync(APP_CONFIG.https.key);
					sysLogger.debug("server", "HTTPS private key successfully loaded for " +  APP_CONFIG.https.key);
				} catch (err) {
					startupError = true;
					sysLogger.fatal("server", "HTTPS private key loading failed for " +  APP_CONFIG.https.key + ", exiting ...");
				}

				//Try to load public key for https
				try {

                                        tlsOptions.cert = FS.readFileSync(APP_CONFIG.https.cert);
					sysLogger.debug("server", "HTTPS public key successfully loaded for " +  APP_CONFIG.https.cert);
                                } catch (err) {
                                        startupError = true;
                                        sysLogger.fatal("server", "HTTPS public key loading failed for " +  APP_CONFIG.https.cert + ", exiting ...");
                                }
			} else {
				startupError = true;
				sysLogger.fatal("server", "No key and/or cert property found in server.json, exiting ...");				
			}
		} else {
			sysLogger.info("server", "HTTPS mode disabled (custom)");
		}	
	} else {
		sysLogger.warn("server", "No https property found in server.json, https disabled (default)");
	}
} else {
	sysLogger.warn("server", "No config file detected, applying default values");
	sysLogger.warn("server", "Debug level set to INFO (default)");
	sysLogger.warn("server", "Https disabled (default)");
}

const APP_PACKAGE_JSON = CORE.getAppPackageJson(sysLogger);
if (APP_PACKAGE_JSON == undefined) {
	startupError = true;
	sysLogger.fatal("server", "No package.json file detected or file corrupted, exiting ...");
}

const APP_VERSION = CORE.getAppVersion(APP_PACKAGE_JSON, sysLogger);
if (APP_PACKAGE_JSON != undefined && APP_VERSION == undefined) {
	startupError = true;
	sysLogger.fatal("server", "No APP version property found in package.json, exiting ...");
}

const APP_REPO_URL = CORE.getAppRepoUrl(APP_PACKAGE_JSON, sysLogger);
if (APP_PACKAGE_JSON != undefined && APP_REPO_URL == undefined) {
	startupError = true;
	sysLogger.fatal("server", "No repository URL property found in package.json, exiting ...");
}

const APP_PORT = CORE.getAppPort(APP_PACKAGE_JSON, sysLogger);
if (APP_PACKAGE_JSON != undefined && APP_PORT == undefined){
	startupError = true;
	sysLogger.fatal("server", "No app port property found in package.json, exiting ...");
}

const DOCKERIZED = CORE.isDockerized(sysLogger);

const DOCKER_STATUS = CORE.loadPropertyFile("./properties/dockerStatusDB.json", sysLogger);
if (DOCKER_STATUS == undefined) {
	startupError = true;
	sysLogger.fatal("server", "No dockerStatusDB.json file detected or file corrupted, exiting ...");
}

const DOCKER_ICONS = CORE.loadPropertyFile("./properties/dockerIconsDB.json", sysLogger);
if (DOCKER_ICONS == undefined) {
	startupError = true;
	sysLogger.fatal("server", "No dockerIconsDB.json file detected or file corrupted, exiting ...");
}

const DOCKER_API_VERSION = DOCKER_API.getDockerAPIVersion(DOCKERIZED, sysLogger);
if (DOCKER_API_VERSION == undefined) {
	startupError = true;
	sysLogger.fatal("server", "No Docker Server API version detected, exiting ...");
}

if (!startupError) {

	sysLogger.info("server", "Startup checks passed successfully");

	//Program global variables
	var app = EXPRESS();
	var accessLogStream = FS.createWriteStream(PATH.join(__dirname, LOG_DIR, LOG_FILE_ACCESS), {flags: "a"});

	//Enabling EXPRESS STATIC middleware - handle css, js, fonts ...
	app.use(EXPRESS.static("public"));

	//Enabling HTTP LOGGER middleware
	app.use(LOGGER_HTTP(LOG_FORMAT_HTTP, {stream: accessLogStream}));

	//Handle homepage requests
	app.get("/", function(req,res) {
		sysLogger.debug("server", "GET Home page handler");
		res.setHeader("Content-Type", "text/html");
		res.render("home.ejs", {appVersion : APP_VERSION, appRepoUrl: APP_REPO_URL, dockerized: DOCKERIZED});
	});

	//Handle API requests
	app.get("/api/containersList", function(req, res) {
		
		sysLogger.debug("server", "GET API Containers list handler");
		//Call Docker API to get the raw list
		DOCKER_API.getContainerList("true", DOCKER_API_VERSION, function(error, data){

			res.setHeader("Content-Type", "application/json");

			if (!error){
				//Create a parsed JSON list with css added info
				//Send the result to the frontend
				sysLogger.debug("server", "GET API Containers list handler - response data: " + data);
				res.send(CONTAINER.jsonToContainers(data, DOCKER_ICONS, DOCKER_STATUS, sysLogger));
			} else {
				sysLogger.error("server", "GET API Container list handler - get list failed");
			 	res.status(500);
                         	res.send();
			}

        	}, sysLogger);	
	});

	app.get("/api/containerInfo/:id", function(req, res) {	

		sysLogger.debug("server", "GET API Container info handler");
		//Retreive and sanitized the container ID
		var result = CONTAINER.sanitizeContainerId(req.params.id, sysLogger);
		sysLogger.debug("server", "GET API Container info handler - sanitization result: " + result.safe);
		
		res.setHeader("Content-Type", "application/json");
		
		if (result.safe) {
			//Call Docker API to get the raw container	
			DOCKER_API.getContainerInfo(result.id, DOCKER_API_VERSION, function(error, data){
				if (!error){
					//Create a parsed JSON with css added info
					//Send the result to the frontend
					sysLogger.debug("server", "GET API Container info handler - response data: " + data);
					res.send(CONTAINER.jsonToContainer(data, DOCKER_ICONS, DOCKER_STATUS, sysLogger));
				} else {
					sysLogger.error("server", "GET API Container info handler - get info failed");
					res.status(500);
					res.send();
				}

			}, sysLogger);

		} else {

			sysLogger.error("server", "GET API Container Info handler - malformed container ID - command aborted");
                        //Send the error to frontend
                        res.status(500);
                        res.send(result);
		}

	});

	app.post("/api/startContainer/:id", function(req, res) {
	
		sysLogger.debug("server", "POST API Start Container handler");
		//Retreive and sanitized the container ID
		var result = CONTAINER.sanitizeContainerId(req.params.id, sysLogger);
	 	sysLogger.debug("server", "POST API Start Container handler - sanitization result: " + result.safe);
		
		res.setHeader("Content-Type", "application/json");

		if (result.safe) {

			//Start the container
			DOCKER_API.startContainer (result.id, DOCKER_API_VERSION, function(result){

				//Send the result to frontend
				//Started and already started are considered as success
				if (!result.error){
				 	sysLogger.debug("server", "POST API Start Container handler - start done");
					res.send(result);
				} else {
					//Unknown container and internal server error are considered as error
					if(result.unknown) {
						sysLogger.error("server", "POST API Start Container handler - start failed - container unknown");
					} else {
						sysLogger.error("server", "POST API Start Container handler - start failed - internal server error");
					}
					res.status(500);
					res.send(result);
				}	

			}, sysLogger);	
		} else {
		
			sysLogger.error("server", "POST API Start Container handler - malformed container ID - start command aborted");
			//Send the error to frontend
			res.status(500);
			res.send(result);
		}
	});
	
	app.post("/api/stopContainer/:id", function(req, res) {
	
		sysLogger.debug("server", "POST API Stop Container handler");
		//Retreive and sanitized the container ID
		var result = CONTAINER.sanitizeContainerId(req.params.id, sysLogger);
	 	sysLogger.debug("server", "POST API Stop Container handler - sanitization result: " + result.safe);
		
		res.setHeader("Content-Type", "application/json");

		if (result.safe) {

			//Stop the container
			DOCKER_API.stopContainer (result.id, DOCKER_API_VERSION, function(result){

				//Send the result to frontend
				//Stopped and already stopped are considered as success
				if (!result.error){
				 	sysLogger.debug("server", "POST API Stop Container handler - stop done");
					res.send(result);
				} else {
					//Unknown container and internal server error are considered as error
					if(result.unknown) {
						sysLogger.error("server", "POST API Stop Container handler - stop failed - container unknown");
					} else {
						sysLogger.error("server", "POST API Stop Container handler - stop failed - internal server error");
					}
					res.status(500);
					res.send(result);
				}	

			}, sysLogger);	
		} else {
		
			sysLogger.error("server", "POST API Stop Container handler - malformed container ID - stop command aborted");
			//Send the error to frontend
			res.status(500);
			res.send(result);
		}
	});
	
	app.post("/api/restartContainer/:id", function(req, res) {
	
		sysLogger.debug("server", "POST API Restart Container handler");
		//Retreive and sanitized the container ID
		var result = CONTAINER.sanitizeContainerId(req.params.id, sysLogger);
	 	sysLogger.debug("server", "POST API Restart Container handler - sanitization result: " + result.safe);
		
		res.setHeader("Content-Type", "application/json");

		if (result.safe) {

			//Restart the container
			DOCKER_API.restartContainer (result.id, DOCKER_API_VERSION, function(result){

				//Send the result to frontend
				//Restarted is considered as success
				if (!result.error){
				 	sysLogger.debug("server", "POST API Restart Container handler - restart done");
					res.send(result);
				} else {
					//Unknown container and internal server error are considered as error
					if(result.unknown) {
						sysLogger.error("server", "POST API Restart Container handler - restart failed - container unknown");
					} else {
						sysLogger.error("server", "POST API Restart Container handler - restart failed - internal server error");
					}
					res.status(500);
					res.send(result);
				}	

			}, sysLogger);	
		} else {
		
			sysLogger.error("server", "POST API Restart Container handler - malformed container ID - restart command aborted");
			//Send the error to frontend
			res.status(500);
			res.send(result);
		}
	});

	app.get("/api/checkUpdate", function(req, res) {

		sysLogger.debug("server", "GET API Check update handler");
		CORE.checkAppUpdate(APP_VERSION, APP_REPO_URL, function (result) {
			//Create a parsed JSON containing the checkUpdate process result
			//Send the result to the frontend
			res.setHeader("Content-Type", "application/json");
                	res.send(result);
	
		}, sysLogger);

	});

	//Handle 404 error page
	app.get("/error", function(req, res) {

		sysLogger.debug("server", "GET Error handler");
		res.setHeader("Content-Type", "text/html");
                res.status(404);
                res.render("error.ejs");	
	});

	//Redirect requests to unknown resources to the generic 404 error page
	app.use(function(req, res, next){
    		sysLogger.debug("server", "Generic Not found handler");
		res.redirect('/error');
	});


	//Create HTTP(S) server
	if (tlsOptions.enable) {
		HTTPS.createServer({key: tlsOptions.key, cert: tlsOptions.cert},app).listen(APP_PORT);
	} else {
		HTTP.createServer(app).listen(APP_PORT);
	} 
	sysLogger.info("server", "Whales Manager v" + APP_VERSION + " started");

} else {

	sysLogger.fatal("server", "Startup checks failed, exiting");
	process.exitCode = 1;
}
