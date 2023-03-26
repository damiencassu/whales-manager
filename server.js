//Generic module loading
const EXPRESS = require("express");
const LOGGER = require("morgan");
const FS = require("node:fs");
const PATH = require("node:path");

//Custom module loading
const DOCKER_API = require("./custom_modules/docker/dockerAPI");
const CORE = require("./custom_modules/core/core");
const CONTAINER = require("./custom_modules/docker/container");

//Program constants
const LOG_DIR = "logs";
const LOG_FORMAT = "common";
const LOG_FILE_ACCESS = "access.log";
const APP_PACKAGE_JSON = CORE.getAppPackageJson();
const APP_VERSION = CORE.getAppVersion(APP_PACKAGE_JSON);
const APP_REPO_URL = CORE.getAppRepoUrl(APP_PACKAGE_JSON);
const APP_PORT = CORE.getAppPort(APP_PACKAGE_JSON);
const DOCKERIZED = CORE.isDockerized();
const DOCKER_STATUS = CORE.loadPropertyFile("./properties/dockerStatusDB.json");
const DOCKER_ICONS = CORE.loadPropertyFile("./properties/dockerIconsDB.json");

//Program global variables
var app = EXPRESS();
var accessLogStream = FS.createWriteStream(PATH.join(__dirname, LOG_DIR, LOG_FILE_ACCESS), {flags: "a"});

//Enabling EXPRESS STATIC middleware - handle css, js, fonts ...
app.use(EXPRESS.static("public"));

//Enabling LOGGER middleware
app.use(LOGGER(LOG_FORMAT, {stream: accessLogStream}));

//Handle homepage requests
app.get("/", function(req,res) {
	res.setHeader("Content-Type", "text/html");
	res.render("home.ejs", {appVersion : APP_VERSION, appRepoUrl: APP_REPO_URL, dockerized: DOCKERIZED});
});

//Handle API requests
app.get("/api/containersList", function(req, res) {

	//Call Docker API to get the raw list
	DOCKER_API.getContainerList("true", function(data){
		//Create a parsed JSON list with css added info
		//Send the result to the frontend
		res.setHeader("Content-Type", "application/json");
		res.send(CONTAINER.jsonToContainer(data, DOCKER_ICONS, DOCKER_STATUS));

        });	
});




//Send default HTTP 404 erreur page if unknown resource
app.use(function(req, res, next){
    res.setHeader("Content-Type", "text/html");
    res.status(404);
    res.render("error.ejs");
});


app.listen(APP_PORT);
