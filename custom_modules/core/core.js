//The core module offers static funtions realted to server initial startup and running tasks

//Generic module loading
const FS = require("node:fs");
const PATH = require("node:path");
const HTTPS = require("node:https");
const URL = require("node:url");

//Custom module loading
const LOGGER_SYS = require("./logger");

//Program constants
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/";
const GITHUB_PACKAGE_LOCATION = "/main/package.json";

//Load App Package.JSON as an object, return undefined if not found or error
function getAppPackageJson (logger){
	if (logger != undefined){
		logger.debug("core", "Loading package.json file");
	}
	try {

        	return JSON.parse(FS.readFileSync("package.json"));
	} catch (err) {
		return undefined;
	}
}

//Load App version from package.json, return undefined if not found
function getAppVersion (packageJson, logger){
	if (packageJson != undefined) {
		if (logger != undefined){
			logger.debug("core", "Detecting running app version from package.json: " + packageJson.version);
		}
		return packageJson.version;
	} else {
		return undefined;
	}
}

//Load App repository URL from package.json, return undefined if not found
function getAppRepoUrl (packageJson, logger){
	if (packageJson != undefined) {
		if (packageJson.repository != undefined) {
			if (logger != undefined){
				logger.debug("core", "Detecting running app repository url from package.json: " + packageJson.repository.url);
			}
			return packageJson.repository.url;
		} else {
			return undefined;
		}
	} else {
		return undefined;
	}
}

//Load App port from package.json, return undefined if not found
function getAppPort (packageJson, logger){
	if (packageJson != undefined) {
		if (packageJson.config != undefined) {
			if (logger != undefined){
				logger.debug("core", "Detecting running app port from package.json: " + packageJson.config.port);
			}
			return packageJson.config.port;
		} else {
			return undefined;
                }
        } else {
                return undefined;
        }
}

//Check if the app is running inside a docker container
function isDockerized (logger){
	if (FS.existsSync("/.dockerenv")) {
		if (logger != undefined){
                	logger.debug("core", "Detecting if running app is dockerized: true");
        	}
		return true;
	} else {
		if (logger != undefined){
                	logger.debug("core", "Detecting if running app is dockerized: false");
        	}
		return false;
	} 
}

//Load a JSON property file, return undefined if not found or error
function loadPropertyFile (filePath, logger){
	if (logger != undefined){
        	logger.debug("core", "Loading property file: " + filePath);
        }
	try {

	        return JSON.parse(FS.readFileSync(filePath));
	} catch (err) {
		return undefined;
	}
}

//Load a JSON config file, return undefined it not found or error
function loadConfigFile (filePath, logger){
        if (logger != undefined){
                logger.debug("core", "Loading config file: " + filePath);
        }
	try {

		return JSON.parse(FS.readFileSync(filePath));		
	} catch (err) {
		return undefined;
	}
}

//Check asynchronously if update is available on the official APP GitHub repository
/* runningVersion : the version of the current running process (from current package.json)
 * appRepoUrl : the repo url of the running app (from current package.json)
 * callback : callback function which takes a result object with the following attributes
 * 	result.update = true|false (if the check update process occured without error)
 * 	result.latest = <string> ("vx.x.x" if an update is available, return the lastest version)
 * 	result.error = true (if the check update process failed)
 */
function checkAppUpdate(runningVersion, appRepoUrl, callback, logger){
		
	//Extracting repository and account name
	var splittedRepoName = appRepoUrl.split(/[.\/]/);
	var repoName = splittedRepoName[splittedRepoName.length - 2];
	var repoAccountName = splittedRepoName[splittedRepoName.length - 3]; 

	//Download latest main remote package.json file for the given repository
	var remotePackageJsonURL = new URL.URL("/" + repoAccountName + "/" + repoName + GITHUB_PACKAGE_LOCATION, GITHUB_RAW_BASE);
	if (logger != undefined){
        	logger.debug("core", "Downloading latest available release from: " + remotePackageJsonURL);
        }
	
	HTTPS.get(remotePackageJsonURL, function(res){
            	
		if (res.statusCode != 200 && res.statusCode != 304){

			if (logger != undefined){
         		      logger.error("core", "Download from " + remotePackageJsonURL + " failed: " + res.statusCode);
        		}
			callback({error: true});
		} else {
			
			var data = "";
               		res.on("data", function(chunk){
                  		data += chunk;
               		});

               		res.on("end", function() {
				if( runningVersion < getAppVersion(JSON.parse(data))){

					if (logger != undefined){
                              			logger.debug("core", "Available update found: " + getAppVersion(JSON.parse(data)));
                        		}
                                	callback({update: true, latest: getAppVersion(JSON.parse(data))});
                        	} else {

					if (logger != undefined){
                                                logger.debug("core", "No available update found");
                                        }
                        		callback({update: false});
                		}
               		});

               		res.on("error", function(err){
				if (logger != undefined){
                                	logger.error("core", "Download from " + remotePackageJsonURL + " failed: " + err.message);
                        	}		
				callback({error: true});
             		});
		}
       	});
}
						 

//Export section
module.exports.getAppPackageJson = getAppPackageJson;
module.exports.getAppVersion = getAppVersion;
module.exports.getAppRepoUrl = getAppRepoUrl;
module.exports.getAppPort = getAppPort;
module.exports.isDockerized = isDockerized; 
module.exports.loadPropertyFile = loadPropertyFile;
module.exports.loadConfigFile = loadConfigFile;
module.exports.checkAppUpdate = checkAppUpdate;
