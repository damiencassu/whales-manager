//The core module offers static funtions realted to server initial startup
const FS = require("node:fs");

//Load App version from package.json
function getAppVersion (){
	return JSON.parse(FS.readFileSync("package.json")).version;
}

//Check if the app is running inside a docker container
function isDockerized (){
	if (FS.existsSync("/.dockerenv")) {
		return true;
	} else {
		return false;
	} 
}

//Export section
module.exports.getAppVersion = getAppVersion;
module.exports.isDockerized = isDockerized; 
