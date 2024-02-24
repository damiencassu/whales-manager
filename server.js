//Generic module loading
const EXPRESS = require("express");
const HTTP = require("node:http");
const HTTPS = require("node:https");
const FS = require("node:fs");
const PATH = require("node:path");

//Custom module loading
const DOCKER_API = require("./custom_modules/docker/dockerAPI");
const CORE = require("./custom_modules/core/core");
const CRYPTO = require("./custom_modules/core/crypto");
const CONTAINER = require("./custom_modules/docker/container");
const IMAGE = require("./custom_modules/docker/image");
const LOGGER_SYS = require("./custom_modules/core/logger");
const LOGGER_HTTP = require("./custom_modules/core/httpLogger");
const NATIVE = require("./custom_modules/auth/native");
const COOKIE = require("./custom_modules/auth/cookie");
const ACCESS = require("./custom_modules/auth/access");

//Log related program constants
const LOG_DIR = "logs";
const LOG_FORMAT_HTTP = "common";
const LOG_FILE_ACCESS = "access.log";
const LOG_FILE_SYS = "server.log";

//Authentication related constants
const WM_AUTH_COOKIE_NAME = "wmAuth";
const WM_AUTH_ID_PARAM_NAME = "wmUserId";
const WM_AUTH_FAILED_REDIRECT = "/login";

//Certs related constants
const CERTS_DIR = "certs";
const CERTS_MANAGER_DIR = "manager";
const CERTS_MANAGER_CA_PRIV = "ca.key";
const CERTS_MANAGER_CA_PUB = "ca.crt";
const CERTS_MANAGER_CA_VALIDITY = 3650;
const CERTS_MANAGER_CERT_PRIV = "servweb.key";
const CERTS_MANAGER_CERT_PUB = "servweb.crt";
const CERTS_MANAGER_CERT_VALIDITY = 365;

//Create Logger for system events
var sysLogger = new LOGGER_SYS("info", PATH.join(__dirname, LOG_DIR, LOG_FILE_SYS));
sysLogger.info("server", "########## Whales Manager starting... ##########");

//TLS options for HTTPS handling
var tlsOptions = {enable: false, key: "", cert: ""};

//Local users database
var usersDB = [];

//Global users sessions table
var usersSessions = new Map();

//Other program constants
var startupError = false;

//Loading APP Config values
const APP_CONFIG = CORE.loadConfigFile("./conf/server.json");
if (APP_CONFIG != undefined) {
	sysLogger.info("server", "Config file detected and successfully loaded, applying values");

	//Checking config for debug level
	if (APP_CONFIG.debugLevel != undefined) {
		sysLogger.logLevel = APP_CONFIG.debugLevel;
		sysLogger.info("server", "Debug level set to " + sysLogger.logLevel.toUpperCase());
	} else {
		startupError = true;
		sysLogger.fatal("server", "No debug level property found in server.json, exiting...");
	}

	//Checking - Initializing crypto environment
	if (CRYPTO.checkOpensslIsInstalled(sysLogger)){
		
		//Check if the Whales Manager Self-Signed CA exists, create it if not
		if (!FS.existsSync(PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR, CERTS_MANAGER_CA_PRIV)) || !FS.existsSync(PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR, CERTS_MANAGER_CA_PUB))){
		
			sysLogger.warn("server", "No Whales Manager CA found, a new one is going to be generated, please wait...");
			
			if (CRYPTO.createSelfSignedCA(CERTS_MANAGER_CA_VALIDITY, PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR, CERTS_MANAGER_CA_PRIV), PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR, CERTS_MANAGER_CA_PUB), sysLogger)){

				sysLogger.warn("server", "A new Whales Manager CA has been generated");
			} else {
				
				startupError = true;
				sysLogger.fatal("server", "An error occurred when generating a new CA, exiting ...");
			}
			
		} else {
			sysLogger.debug("server", "A Whales Manager CA has been found");
		}

		//Check if Whales Manager CA delivered certificates are available, generate them if not
		if (!FS.existsSync(PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR, CERTS_MANAGER_CERT_PRIV)) || !FS.existsSync(PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR, CERTS_MANAGER_CERT_PUB))){

			sysLogger.warn("server", "No Whales Manager certificate found, a new one is going to be generated, please wait...");

			if (CRYPTO.createCertificate(CERTS_MANAGER_CERT_VALIDITY, PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR, CERTS_MANAGER_CERT_PRIV), PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR, CERTS_MANAGER_CERT_PUB), PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR, CERTS_MANAGER_CA_PRIV), PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR, CERTS_MANAGER_CA_PUB), sysLogger)){
			
				sysLogger.warn("server", "A new Whales Manager certificate has been generated");
			} else {
				
				startupError = true;
				sysLogger.fatal("server", "An error occurred when generating a new Whales Manager certificate, exiting ...");
			}

		} else {
			sysLogger.debug("server", "Whales Manager CA delivered certificates have been found");
		}	

	} else {
		startupError = true;
		sysLogger.fatal("server", "Openssl is not installed, exiting ...");
	}

	//Checking config for https
	if (APP_CONFIG.https != undefined){
		if (APP_CONFIG.https.enabled != undefined){
			if (JSON.parse(APP_CONFIG.https.enabled)){
				tlsOptions.enable = true;
				sysLogger.info("server", "HTTPS mode enabled (default)");
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
			startupError = true;
			sysLogger.fatal("server", "No https.enabled property found in server.json, exiting ..."); 
		}	
	} else {
		startupError = true;
		sysLogger.fatal("server", "No https property found in server.json, exiting...");
	}

	//Checking for authentication configuration
	if (APP_CONFIG.authentication != undefined){
		if(APP_CONFIG.authentication.enabled != undefined && APP_CONFIG.authentication.type != undefined){

			if(JSON.parse(APP_CONFIG.authentication.enabled) && APP_CONFIG.authentication.type == "native"){
				
				sysLogger.info("server", "Native authentication enabled (default)");

				//Try to load local users database
				usersDB = NATIVE.loadUsersFile("./conf/users.json", sysLogger);
				
				if (usersDB != undefined){
					sysLogger.info("server", "Local users database loaded sucessfully");
				} else {
					startupError = true;
		                        sysLogger.fatal("server", "Failed to load users database file, exiting...");
				}

			} else if (JSON.parse(APP_CONFIG.authentication.enabled) && APP_CONFIG.authentication.type != undefined) { 
				
				startupError = true;
                               	sysLogger.fatal("server", "Unknown authentication type detected, exiting...");
			}else {
				
				sysLogger.warn("server", "Authentication disabled (custom)");
			}

		} else {
			startupError = true;
                	sysLogger.fatal("server", "No authentication enable and/or no authentication type property found in server.json, exiting...");
		}

	} else {
		startupError = true;
                sysLogger.fatal("server", "No authentication property found in server.json, exiting...");
	}

} else {
	startupError = true;
	sysLogger.fatal("server", "No config file detected, exiting...");
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

	/*
	 * Unprotected resources
	 */

	//Enabling EXPRESS STATIC middleware - handle css, js, fonts ...
	app.use(EXPRESS.static("public"));

	//Enabling application/json POST body parsing
	app.use(EXPRESS.json());

	//Enabling HTTP LOGGER middleware
	app.use(LOGGER_HTTP(accessLogStream, WM_AUTH_ID_PARAM_NAME));

	//Handle login page requests
        app.get("/login", function(req,res) {
                sysLogger.debug("server", "GET Login page handler");
                res.setHeader("Content-Type", "text/html");
                res.render("login.ejs");
        });

	//Handle login credentials post requests
        app.post("/login", function(req,res) {
                
		sysLogger.debug("server", "POST Login credentials handler");
		res.setHeader("Content-Type", "application/json");

		//Checking user input
		if (req.body.id != undefined && req.body.pwd != undefined) {
			
			var resultId = NATIVE.sanitizeUserId(req.body.id, sysLogger);
			var resultPwd = NATIVE.sanitizeUserPassword(req.body.pwd, sysLogger);
			if (!resultId.safe || !resultPwd.safe){
				sysLogger.debug("server", "Malformed or unauthorized credentials in post authentication request");
				res.status(401);
                         	res.send();
			} else if (usersDB[resultId.id] == undefined) {
				sysLogger.info("server", "User " + resultId.id + " unknown - authentication failed");
                                res.status(401);
                                res.send();
			} else {
				
				//Hash inputed password and compare with one stored in DB
				NATIVE.hashPassword(resultPwd.pwd, usersDB[resultId.id].salt, function(error, hashedPassword){

					if (!error){
					
						if (hashedPassword == usersDB[resultId.id].hash){
							sysLogger.info("server", "User " + resultId.id + " - authentication successfull");

							//Create a new cookie
							var cookie = new COOKIE(WM_AUTH_COOKIE_NAME, req.hostname, tlsOptions.enable);
							//Generate a new cookie value
							COOKIE.generateCookieValue(function(error, cookieValue){
								
								if (!error){
									//Assign the value to the cookie
									cookie.value = cookieValue;
									//Register the session
		                                                        cookie.registerCookie(usersSessions, resultId.id, sysLogger);
									//Set the cookie to the response
									res.cookie(cookie.name, cookie.value, cookie.options);
									//Send the cookie to user and redirect to home page
									var data = new Object();
                                                        		data.location = "/";
                                                        		res.send(data);
								} else {
									sysLogger.error("server", "User " + resultId.id + " - cookie generation failed - authentication rejected");
									res.status(401);
                                                        		res.send();
								}
							}, sysLogger);

						} else {
							sysLogger.info("server", "User " + resultId.id + " - authentication failed");
							res.status(401);
                         				res.send();
						}
					} else {
						sysLogger.error("server", "User " + resultId.id + " - inputed password hash computation failed - authentication rejected");
						res.status(401);
                                                res.send();
					}
				}, sysLogger);
			}
		} else {
			sysLogger.debug("server", "Credentials missing in post authentication request");
                        res.status(401);
                        res.send();
		}
        });	



	//Enabling ACCESS middleware
	app.use(ACCESS(usersSessions, WM_AUTH_ID_PARAM_NAME, WM_AUTH_COOKIE_NAME, JSON.parse(APP_CONFIG.authentication.enabled), WM_AUTH_FAILED_REDIRECT, tlsOptions.enable, sysLogger));

	/*
	 * Protected resources	
	 */

	//Handle homepage requests
        app.get("/", function(req,res) {
                sysLogger.debug("server", "GET Home page handler");
                res.setHeader("Content-Type", "text/html");
                res.render("home.ejs", {appVersion : APP_VERSION, appRepoUrl: APP_REPO_URL, dockerized: DOCKERIZED});
        });

        //Handle settings page requests
        app.get("/settings", function(req,res) {
                sysLogger.debug("server", "GET Settings page handler");
                res.setHeader("Content-Type", "text/html");
                res.render("settings.ejs");

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
				sysLogger.error("server", "GET API Containers list handler - get list failed");
			 	res.status(500);
                         	res.send();
			}

        	}, sysLogger);	
	});

	app.get("/api/imagesList", function(req, res) {

                sysLogger.debug("server", "GET API Images list handler");
                //Call Docker API to get the raw list
                DOCKER_API.getImageList(DOCKER_API_VERSION, function(error, data){

                        res.setHeader("Content-Type", "application/json");

                        if (!error){
                                //Create a parsed JSON cleaned list
                                //Send the result to the frontend
                                sysLogger.debug("server", "GET API Images list handler - response data: " + data);
                                res.send(IMAGE.jsonToImages(data, sysLogger));
                        } else {
                                sysLogger.error("server", "GET API Images list handler - get list failed");
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


	app.get("/api/systemInfo", function(req, res) {

		sysLogger.debug("server", "GET API System infos handler");
		//Call Docker API to get the system infos
                DOCKER_API.getSystemInfo(DOCKER_API_VERSION, function(error, data){

                        res.setHeader("Content-Type", "application/json");

                        if (!error){
                                //Send the result to the frontend
                                sysLogger.debug("server", "GET API System infos handler - response data: " + data);
                                res.send(data);
                        } else {
                                sysLogger.error("server", "GET API System infos handler - get list failed");
                                res.status(500);
                                res.send();
                        }

                }, sysLogger);


        });

	app.get("/api/engineInfo", function(req, res) {

                sysLogger.debug("server", "GET API Engine infos handler");
                //Call Docker API to get the engine infos
                DOCKER_API.getEngineInfo(DOCKER_API_VERSION, function(error, data){

                        res.setHeader("Content-Type", "application/json");

                        if (!error){
                                //Send the result to the frontend
                                sysLogger.debug("server", "GET API Engine infos handler - response data: " + data);
                                res.send(data);
                        } else {
                                sysLogger.error("server", "GET API Engine infos handler - get list failed");
                                res.status(500);
                                res.send();
                        }

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
