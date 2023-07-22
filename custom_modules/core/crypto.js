//The crypto module offers static funtions realted to certificates generation and management


//Generic module loading
const FS = require("node:fs");
const PATH = require("node:path");
const CP = require("node:child_process");

//Program constants
const CA_CONF_FILE = "conf/ca.cfg";
const CERT_CONF_FILE = "conf/servweb.cfg";

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

//Function which creates a 4096 bit length private RSA key
/*
 * privKey: path where to store the generated private key
 */
function createPrivateKey(privKey){

	CP.execSync("openssl genrsa 4096 > " + privKey);
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
		//CP.execSync("openssl genrsa 4096 > " + caPrivKey);
		createPrivateKey(caPrivKey);

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

//Function which creates a new private key and the associated Certificate Signing Request (CSR)
/*
 * certPrivKey: path where to store the cert private key 
 * certSR: path where to store the CSR
 */
function createCSR(certPrivKey, certSR, logger){

	//Certificate private key generation
	if (logger != undefined){
		logger.debug("crypto", "Generating a new private key in " + certPrivKey);
	}
	createPrivateKey(certPrivKey);

	//Certificate Signing Request generation
	if (logger != undefined){
		logger.debug("crypto", "Generating a new CSR in " + certSR);
	}
	CP.execSync("openssl req -config " + CERT_CONF_FILE + " -new -key " +  certPrivKey + " > " + certSR);

}	

//Create Certificate
function createCertificate(certValidity, certPrivKey, certPubKey, caPrivKey, caPubKey, logger){

	//Certificate Private key and CSR generation
	createCSR(certPrivKey, certPubKey.replace(/cert/g, 'csr'), logger);
	
	//Certificate Signing Request signature
	if (logger != undefined){
		logger.debug("crypto", "Generating a new certificate in " + certPubKey + " by signing the CSR in " + certPubKey.replace(/cert/g, 'csr'));
	}
	CP.execSync("openssl x509 -extfile " + CERT_CONF_FILE + " -req -in " + certPubKey.replace(/cert/g, 'csr') + " -out " + certPubKey + " -CA " + caPubKey + " -CAkey " + caPrivKey + " -days " + certValidity); 

}

//Export section
module.exports.checkOpensslIsInstalled = checkOpensslIsInstalled;
module.exports.createSelfSignedCA = createSelfSignedCA;
module.exports.createCertificate = createCertificate;
