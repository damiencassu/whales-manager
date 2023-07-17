//The crypto module offers static funtions realted to certificates generation and management


//Generic module loading
const FS = require("node:fs");
const PATH = require("node:path");
const CP = require("node:child_process");

//Custom module loading
const LOGGER_SYS = require("./logger");

//Check openssl is installed
function checkOpensslIsInstalled(logger){

	try {
		var opensslVersion = CP.execSync("openssl version").toString().replace( /[\n\r]/g, '');
		if (logger != undefined){
			logger.debug("crypto", "Detecting Openssl version: " + opensslVersion);
		}
		return true;

	} catch (err) {
		return false;
	}
}

//Creates Certificate Authority (CA)


//Creates Certificate Signing Request (CSR)


//Create Certificate

//Export section
module.exports.checkOpensslIsInstalled = checkOpensslIsInstalled;
