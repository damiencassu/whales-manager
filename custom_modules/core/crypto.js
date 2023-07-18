//The crypto module offers static funtions realted to certificates generation and management


//Generic module loading
const FS = require("node:fs");
const PATH = require("node:path");
const CP = require("node:child_process");

//Program constants
const CA_CONF_FILE = "templates/certs/ca.cfg";

//Function which checks if openssl is installed
function checkOpensslIsInstalled(logger){

	try {
		var opensslVersion = CP.execSync("openssl version").toString().replace(/[\n\r]/g, '');
		if (logger != undefined){
			logger.debug("crypto", "Detecting Openssl version: " + opensslVersion);
		}
		return true;

	} catch (err) {
		return false;
	}
}

//Function which creates a new Certificate Authority (CA)
/*
 * caValidity: number of days the CA will be valid
 * caPrivKey: path where to store the CA private key
 * caPubKey: path where to store the CA public key
 */
function createSelfSignedCA(caValidity, caPrivKey, caPubKey, logger){

	try {
		//CA Private Key generation
		if (logger != undefined){
			logger.debug("crypto", "Generating a new CA private key in " + caPrivKey);
		}
		CP.execSync("openssl genrsa 4096 > " + caPrivKey);

		//CA Public Key generation
		if (logger != undefined){
			logger.debug("crypto", "Generating a new CA public key in " + caPubKey);
		}
		CP.execSync("openssl req -config " + CA_CONF_FILE + " -new -x509 -days " + caValidity + " -key " + caPrivKey + " > " + caPubKey);

		return true;

	} catch (err) {
		return false;
	}		
}

//Creates Certificate Signing Request (CSR)


//Create Certificate

//Export section
module.exports.checkOpensslIsInstalled = checkOpensslIsInstalled;
module.exports.createSelfSignedCA = createSelfSignedCA;
