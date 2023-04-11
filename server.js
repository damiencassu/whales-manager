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

//Create local logs directory if needed
if (!FS.existsSync(PATH.join(__dirname, LOG_DIR))){
        FS.mkdirSync(PATH.join(__dirname, LOG_DIR));
}

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
		sysLogger.warn("server", "Debug level set to INFO (default)");
	}
} else {
	sysLogger.warn("server", "No config file detected, applying default values");
        sysLogger.warn("server", "Debug level set to INFO (default)");
}

//Other program constants
const APP_PACKAGE_JSON = CORE.getAppPackageJson(sysLogger);
const APP_VERSION = CORE.getAppVersion(APP_PACKAGE_JSON, sysLogger);
const APP_REPO_URL = CORE.getAppRepoUrl(APP_PACKAGE_JSON, sysLogger);
const APP_PORT = CORE.getAppPort(APP_PACKAGE_JSON, sysLogger);
const DOCKERIZED = CORE.isDockerized(sysLogger);
const DOCKER_STATUS = CORE.loadPropertyFile("./properties/dockerStatusDB.json", sysLogger);
const DOCKER_ICONS = CORE.loadPropertyFile("./properties/dockerIconsDB.json", sysLogger);
const DOCKER_API_VERSION = DOCKER_API.getDockerAPIVersion(DOCKERIZED, sysLogger);

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

	//Call Docker API to get the raw list
	DOCKER_API.getContainerList("true", DOCKER_API_VERSION, function(data){
		//Create a parsed JSON list with css added info
		//Send the result to the frontend
		sysLogger.debug("server", "GET API Containers list handler - response data: " + data);
		res.setHeader("Content-Type", "application/json");
		res.send(CONTAINER.jsonToContainer(data, DOCKER_ICONS, DOCKER_STATUS, sysLogger));

        }, sysLogger);	
});

app.get("/api/checkUpdate", function(req, res) {

	CORE.checkAppUpdate(APP_VERSION, APP_REPO_URL, function (result) {
		//Create a parsed JSON containing the checkUpdate process result
		//Send the result to the frontend
		sysLogger.debug("server", "GET API Check update handler");
		res.setHeader("Content-Type", "application/json");
                res.send(result);
	
	}, sysLogger);

});

//Send default HTTP 404 erreur page if unknown resource
app.use(function(req, res, next){
    sysLogger.debug("server", "Not found handler");
    res.setHeader("Content-Type", "text/html");
    res.status(404);
    res.render("error.ejs");
});


app.listen(APP_PORT);
sysLogger.info("server", "Whales Manager v" + APP_VERSION + " started");
