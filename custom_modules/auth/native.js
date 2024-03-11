//The native module offers static funtions related to local authentication and user management

//Generic module loading
const FS = require("node:fs");
const PATH = require("node:path");
const NODECRYPO = require("node:crypto");

//Program constants
const PWD_MIN_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATION = 210000;
const PBKDF2_KEYLENGTH = 64;
const PBKDF2_DIGEST = "sha512";

//Load a local users database from JSON file as a MAP, return undefined if not found or error
function loadUsersFile(filePath, logger){
	
	if (logger != undefined){
        	logger.debug("native", "Loading users file: " + filePath);
        }
	try {

	        return new Map(Object.entries(JSON.parse(FS.readFileSync(filePath))));
	} catch (err) {
		return undefined;
	}
}

//Push an updated native user to a JSON file
/*
 * filePath: path to the local users JSON file
 * user: user to push to the file
 * callback function which takes
 * 	a boolean error value set to true if an error occured, false otherwise
 */
function pushUserToFile(filePath, user, callback, logger){

        if (logger != undefined){
                logger.debug("native", "Pushing updated user fo file: " + filePath);
        }
	
	//Write the user to the local perisitent file
	var parsedUser = new Object();
	parsedUser[user.username] = {salt: user.salt, hash: user.hash};
	FS.writeFile(filePath, JSON.stringify(parsedUser), function(err){
	
		if (!err){

			if (logger != undefined){
                		logger.debug("native", "Updated user sucessfully pushed to file: " + filePath);
        		}
			
			callback(false);

		} else {
			
			if (logger != undefined){
                                logger.error("native", "Error while writting file: " + filePath);
                        }
			callback(true);
		}


	});
}

//Sanitize user id
/*
 * uid: plaintext and raw id entered by the user
 * Returns sanitized id and safe equal true (or just safe equal false if the check/cleaning operation failed)
 */
function sanitizeUserId(uid, logger){

	var regexp = /^[A-Za-z0-9]*$/i;
        if (regexp.test(uid) && uid != ""){

                if (logger != undefined){
                        logger.debug("native", "User ID (" + uid + ") sanitization OK");
                }
                return {safe: true, id: uid};

        } else {

                if (logger != undefined){
                        logger.debug("native", "User ID (" + uid + ") sanitization KO");
                }
                return {safe: false};
        }
}

//Sanitize and normalize user password
/*
 * password: plaintext and raw password entered by the user
 * Returns normalized/sanitized password and safe equal true (or just safe equal false if the check/cleaning operation failed)
 */
function sanitizeUserPassword(password, logger){

	if (password.length >= PWD_MIN_LENGTH){

		//Normalize string to avoid erratic behavior in node crypto api
		if (logger != undefined){
                	logger.debug("native", "Sanitizing user password: " + password.substring(0,3) + "*******");
        	}
		return {safe: true, pwd: password.normalize("NFD")};

	} else {

		if (logger != undefined){
                	logger.debug("native", "User password sanitization failed - password too short");
        	}
		return {safe: false};
	}
}

//Generate hashed user password
/*
 * password: user sanitized password
 * salt: random string hex value to be used as password salt
 * callback function which takes
 * 	a boolean error value set to true if an error occured, false otherwise
 *	the newly generated hashed password (if no error only)
 */
function hashPassword(password, salt, callback, logger) {

	//Hash password using pbkdf2 FIPS-140 compliant algorithm
        NODECRYPO.pbkdf2(password, salt, PBKDF2_ITERATION, PBKDF2_KEYLENGTH, PBKDF2_DIGEST, function (err, derivedKey){
		
		if (err){

			if (logger != undefined){
                        	logger.error("native", "Password hash computation failed");
                	}
			callback(true);

		} else {

			if (logger != undefined){
                                logger.debug("native", "Password hash computed successfully");
                        }
			callback(false,derivedKey.toString("hex"));
		}

       });

}

//Update password of a native user
/*
 * username: sanitized name of the user to update
 * password: sanitized password of the new password to set to the user
 * callback function which takes
 * 	a boolean error value set to true if an error occured, false otherwise
 * 	the updated user object to store in the local database (if no error only)
 */
function updateUserPassword(username, password, callback, logger){

	var newUser = new Object();

	newUser.username = username;

	//Generate NIST SP800-132 compliant random salt
	NODECRYPO.randomBytes(SALT_LENGTH, function(err, buf){
		
		if (err){

                        if (logger != undefined){
                                logger.error("native", "User password update error - salt generation failure - aborted");
                	}
                        callback(true);
		} else {
		
			newUser.salt = buf.toString("hex");
			hashPassword(password, newUser.salt, function(error, hashedPassword){

				if (!error){

					if (logger != undefined){
                                		logger.debug("native", "New user password generated");
                        		}

					newUser.hash = hashedPassword;
					callback(false, newUser);
				} else {
				
					if (logger != undefined){
                                        	logger.error("native", "New user password generation failed");
                                	}
					callback(true);
				}
			}, logger);
		}
	});
}

//Update username of a native user
/*
 * username: sanitized name of the new username to set
 * salt: password salt of the user to update
 * hash: password hash of the the user to update
 */
function updateUserName(username, salt, hash, logger){
	
	var newUser = new Object();
        newUser.username = username;
	newUser.salt = salt;
	newUser.hash = hash;

	if (logger != undefined){
        	logger.debug("native", "New user username generated");
        }

	return newUser;
}

//Export section
module.exports.loadUsersFile = loadUsersFile;
module.exports.pushUserToFile = pushUserToFile;
module.exports.sanitizeUserPassword = sanitizeUserPassword;
module.exports.sanitizeUserId = sanitizeUserId;
module.exports.hashPassword = hashPassword;
module.exports.updateUserPassword = updateUserPassword;
module.exports.updateUserName = updateUserName;
