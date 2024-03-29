//The access module acts as an express middleware and checks users are properly logged in prior accessing protected resources

//Custom module loading
const COOKIE = require("./cookie");

/*
 * usersSessionsTable: the MAP containing active user sessions
 * userIDAttribute: the name of the attribute where the access middleware has to register the user ID (if the user is logged in, nothing is stored if not)
 * cookieName: the name of the authentication cookie to check
 * authStatus: a boolean set to true if the authentication is enabled in conf file, false if not
 * location: where to redirect the user if he is not properly logged in
 * secure: a boolean set to true if the secure flag is set on the auth cookie, false otherwise 
 */ 
function access(usersSessionsTable, userIDAttribute, cookieName, authStatus, location, secure, logger){

	return function(req, res, next) {

		//Check if the authentication is enabled
		if (!authStatus){
			
			if (logger != undefined){
				logger.debug("access", "Authentication disabled, skipping access middleware controls");
			}

			next();

		//Check the auth cookie
		} else if (req.get('Cookie') != undefined) {
			
			//Check if the auth cookie is present in the request
			var result = COOKIE.parseCookie(req.get('Cookie'), cookieName, req.hostname, secure, logger);
			
			if(!result.found){

				if (logger != undefined){
                                	logger.debug("access", "Authentication cookie not found, access denied, redirecting user to " + location);
                        	}

				res.redirect(location);
			
			//Check if the auth cookie is valid
			} else if (!result.authCookie.checkCookieValidity(usersSessionsTable, logger)){

				if (logger != undefined){
                                        logger.debug("access", "Authentication cookie expired or invalid, access denied, redirecting user to " + location);
                                }

				res.clearCookie(result.authCookie.name, result.authCookie.options);
				res.redirect(location);

	                //If the cookie is valid, register the user ID in the request and let the user pass
			} else {

				if (logger != undefined){
                                        logger.debug("access", "Authentication cookie valid, access granted");
                                }

				req[userIDAttribute] = usersSessionsTable.get(result.authCookie.value);
				next();
			}

		} else {
			
			if (logger != undefined){
                                logger.debug("access", "No cookie found, access denied, redirecting user to " + location);
                        }
			
			res.redirect(location);
		}

	};
}

//Export section
module.exports = access;
