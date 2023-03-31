//The core module offers static funtions realted to server initial startup and running tasks
const FS = require("node:fs");
const CP = require("node:child_process");
const OS = require("node:os");
const PATH = require("node:path");

//Load App Package.JSON as an object
function getAppPackageJson (){
        return JSON.parse(FS.readFileSync("package.json"));
}

//Load asynchronously an App Package.JSON as an object
/* Can raise an exception if error when reading the file
 * filePath : file to the package.json file to load
 * callback : callback function which takes a data object containing the loaded package.json file as an object
 */
function getPackageJson (filePath, callback){
	FS.readFile(filePath, function(err, data){
		if (err) throw err;
		callback(JSON.parse(data));
	});

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
 * 	result.latest = <string> ("vx.x.x" if an update is available, retuirn the lastest version)
 * 	result.error = true (if the check update process failed)
 */
function checkAppUpdate(runningVersion, appRepoUrl, callback){
	try {
		//Create temp directory to clone the remote repository
		FS.mkdtemp(PATH.join(OS.tmpdir(), "wm-"), function (err, tempDir) {
			if (err) throw err;
			try {
				console.log("temp dir created : " + tempDir); 
				//Clone the repository		
				CP.exec("git clone " + appRepoUrl + " " + tempDir ,function (err, stdout, stderr) {
					if (err) throw err;
					console.log("git clone done");
			 		//Extract remote version
					getPackageJson (PATH.join(tempDir, "package.json"), function (data){
						//Compare with running one
						if( runningVersion < getAppVersion(data)){
							console.log("update available");
							callback({update: true, latest: getAppVersion(data)});
						} else {
							console.log("no update available");
							callback({update: false});
						}
					}); 
				
					//If all went well, remove tempDir
					try {
                                        	FS.rm(tempDir, {force: true, recursive: true}, function (err) {
                                                	if (err) throw err;
							console.log("cleanup done");
                                        	});
                                	} catch (error) {
                                        	console.log(error);
                                	}
				});

			} catch (error) {
				//If error, remove tempDir
				console.log(error);
				try {
                                        FS.rm(tempDir, {force: true, recursive: true}, function (err) {
                                                if (err) throw err;
						console.log("cleanup done");
                                        });
                                } catch (error) {
                                        console.log(error);
                                } finally {
					//Return update error notification
					callback({error: true});
				}
				
			}
		});
	} catch (error) {
		console.log(error);
		//Return update error notification
		callback({error: true});
	}	

}

//Export section
module.exports.getAppPackageJson = getAppPackageJson;
module.exports.getAppVersion = getAppVersion;
module.exports.getAppRepoUrl = getAppRepoUrl;
module.exports.getAppPort = getAppPort;
module.exports.isDockerized = isDockerized; 
module.exports.loadPropertyFile = loadPropertyFile;
module.exports.checkAppUpdate = checkAppUpdate;
