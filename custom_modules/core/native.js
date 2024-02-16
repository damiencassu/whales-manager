//The native module offers static funtions related to local authentication and user management

//Generic module loading
const FS = require("node:fs");
const PATH = require("node:path");

//Load a local users database from JSON file, return undefined if not found or error
function loadUsersFile (filePath, logger){
	if (logger != undefined){
        	logger.debug("file", "Loading users file: " + filePath);
        }
	try {

	        return JSON.parse(FS.readFileSync(filePath));
	} catch (err) {
		return undefined;
	}
}


//Export section
module.exports.loadUsersFile = loadUsersFile;
