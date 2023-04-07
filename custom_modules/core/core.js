//The core module offers static funtions realted to server initial startup and running tasks
const FS = require("node:fs");
const PATH = require("node:path");
const HTTPS = require("node:https");
const URL = require("node:url");

//Program constants
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/";
const GITHUB_PACKAGE_LOCATION = "/main/package.json";

//Load App Package.JSON as an object
function getAppPackageJson (){
        return JSON.parse(FS.readFileSync("package.json"));
}

//Load App version from package.json
function getAppVersion (packageJson){
	return packageJson.version;
}

//Load App repository URL from package.json
function getAppRepoUrl (packageJson){
        return packageJson.repository.url;
}

//Load App port from package.json
function getAppPort (packageJson){
	return packageJson.config.port;
}

//Check if the app is running inside a docker container
function isDockerized (){
	if (FS.existsSync("/.dockerenv")) {
		return true;
	} else {
		return false;
	} 
}

//Load a JSON property file
function loadPropertyFile (filePath){
        return JSON.parse(FS.readFileSync(filePath));
}

//Check asynchronously if update is available on the official APP GitHub repository
/* runningVersion : the version of the current running process (from current package.json)
 * appRepoUrl : the repo url of the running app (from current package.json)
 * callback : callback function which takes a result object with the following attributes
 * 	result.update = true|false (if the check update process occured without error)
 * 	result.latest = <string> ("vx.x.x" if an update is available, return the lastest version)
 * 	result.error = true (if the check update process failed)
 */
function checkAppUpdate(runningVersion, appRepoUrl, callback){
		
	//Extracting repository and account name
	var splittedRepoName = appRepoUrl.split(/[.\/]/);
	var repoName = splittedRepoName[splittedRepoName.length - 2];
	var repoAccountName = splittedRepoName[splittedRepoName.length - 3]; 

	//Download latest main remote package.json file for the given repository
	var remotePackageJsonURL = new URL.URL("/" + repoAccountName + "/" + repoName + GITHUB_PACKAGE_LOCATION, GITHUB_RAW_BASE);

	console.log(remotePackageJsonURL);
	HTTPS.get(remotePackageJsonURL, function(res){
            	
		if (res.statusCode != 200 && res.statusCode != 304){

			console.log("error contacting raw github:" + res.statusCode);
			callback({error: true});
		} else {
			var data = "";
               		res.on("data", function(chunk){
                  		data += chunk;
               		});

               		res.on("end", function() {
				if( runningVersion < getAppVersion(JSON.parse(data))){
                              		console.log("update available");
                                	callback({update: true, latest: getAppVersion(JSON.parse(data))});
                        	} else {
                                	console.log("no update available");
                        		callback({update: false});
                		}
               		});

               		res.on("error", function(err){
                 		console.log("ERROR : API Call failed : " + err.message);
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
module.exports.checkAppUpdate = checkAppUpdate;
