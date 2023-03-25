//Generic module loading
const EXPRESS = require("express");
const LOGGER = require("morgan");
const FS = require("node:fs");
const PATH = require("node:path");

//Custom module loading
//var Container = require("./custom_modules/container");
const DOCKER_API = require("./custom_modules/docker/dockerAPI");
const CORE = require("./custom_modules/core/core");

//Program constants
const LOG_DIR = "logs";
const LOG_FORMAT = "common";
const LOG_FILE_ACCESS = "access.log";
const APP_VERSION = CORE.getAppVersion();
const DOCKERIZED = CORE.isDockerized();


//Program global variables
var app = EXPRESS();
var accessLogStream = FS.createWriteStream(PATH.join(__dirname, LOG_DIR, LOG_FILE_ACCESS), {flags: "a"});

//Enabling EXPRESS STATIC middleware - handle css, js, fonts ...
app.use(EXPRESS.static("public"));

//Enabling LOGGER middleware
app.use(LOGGER(LOG_FORMAT, {stream: accessLogStream}));


app.get("/", function(req,res) {
	DOCKER_API.getContainerList("true", function(data){
		console.log(data);
	});
	res.setHeader("Content-Type", "text/html");
	res.render("home.ejs", {appVersion : APP_VERSION, dockerized: DOCKERIZED});
});


//Send default HTTP 404 erreur code if unknown resource
app.use(function(req, res, next){
    res.setHeader("Content-Type", "text/plain");
    res.send(404, "Page introuvable !");
});


app.listen(8888);
