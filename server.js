//Generic module loading
const EXPRESS = require("express");
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

//Loading APP Config values
const APP_CONFIG = CORE.loadConfigFile("./conf/server.json");
if (APP_CONFIG != undefined) {
	sysLogger.info("server", "Config file detected and successfully loaded, applying custom values");
	if (APP_CONFIG.debugLevel != undefined) {
		sysLogger.logLevel = APP_CONFIG.debugLevel;
		sysLogger.info("server", "Debug level set to " + sysLogger.logLevel.toUpperCase() + " (custom)");
	} else {
		sysLogger.warn("server", "No debug level property found in server.json, debug level set to INFO (default)");
	}
} else {
	sysLogger.warn("server", "No config file detected, applying default values");
        sysLogger.warn("server", "Debug level set to INFO (default)");
}

//Other program constants
var startupError = false;

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
		DOCKER_API.getContainerList("true", DOCKER_API_VERSION, function(data){
			//Create a parsed JSON list with css added info
			//Send the result to the frontend
			sysLogger.debug("server", "GET API Containers list handler - response data: " + data);
			res.setHeader("Content-Type", "application/json");
			res.send(CONTAINER.jsonToContainer(data, DOCKER_ICONS, DOCKER_STATUS, sysLogger));

        	}, sysLogger);	
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

	//Redirects requests to unknown resources to the generic 404 error page
	app.use(function(req, res, next){
    		sysLogger.debug("server", "Generic Not found handler");
		res.redirect('/error');
	});


	app.listen(APP_PORT);
	sysLogger.info("server", "Whales Manager v" + APP_VERSION + " started");

} else {

	sysLogger.fatal("server", "Startup checks failed, exiting");
	process.exitCode = 1;
}
