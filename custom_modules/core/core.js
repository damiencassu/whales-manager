//The core module offers static funtions realted to server initial startup
const FS = require("node:fs");

//Load App version from package.json
function getAppVersion (){
	return JSON.parse(FS.readFileSync("package.json")).version;
}

//Load App repository URL from package.json
function getAppRepoUrl (){
        return JSON.parse(FS.readFileSync("package.json")).repository.url;
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

//Export section
module.exports.getAppVersion = getAppVersion;
module.exports.getAppRepoUrl = getAppRepoUrl;
module.exports.isDockerized = isDockerized; 
module.exports.loadPropertyFile = loadPropertyFile;
