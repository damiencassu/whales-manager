//Generic module loading
const EXPRESS = require("express");
const LOGGER = require("morgan");
const FS = require("fs");
const PATH = require("path");

//Custom module loading
//var Container = require("./custom_modules/container");
const DOCKER_API = require("./custom_modules/dockerAPI");

//Program constants
const LOG_DIR = "logs";
const LOG_FORMAT = "common";
const LOG_FILE_ACCESS = "access.log";

//Program global variables
var app = EXPRESS();
var accessLogStream = FS.createWriteStream(PATH.join(__dirname, LOG_DIR, LOG_FILE_ACCESS), {flags: "a"});

//Enabling EXPRESS STATIC middleware - handle css, js, fonts ...
app.use(EXPRESS.static("public"));

//Enabling LOGGER middleware
app.use(LOGGER(LOG_FORMAT, {stream: accessLogStream}));


app.get("/", function(req,res) {
	//console.log(DOCKER_API.test());
	DOCKER_API.getContainerList("true", function(data){
		console.log(data);
	});
	res.setHeader("Content-Type", "text/html");
	res.render("home.ejs");
        //res.render("accueil.ejs", {test: "bravo !"});
});


//Send default HTTP 404 erreur code if unknown resource
app.use(function(req, res, next){
    res.setHeader("Content-Type", "text/plain");
    res.send(404, "Page introuvable !");
});


app.listen(8888);
