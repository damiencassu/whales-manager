//The core module offers static funtions realted to server initial startup
const FS = require("node:fs");

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

//Export section
module.exports.getAppPackageJson = getAppPackageJson;
module.exports.getAppVersion = getAppVersion;
module.exports.getAppRepoUrl = getAppRepoUrl;
module.exports.getAppPort = getAppPort;
module.exports.isDockerized = isDockerized; 
module.exports.loadPropertyFile = loadPropertyFile;
