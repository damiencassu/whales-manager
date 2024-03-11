//Class representing an authentication cookie

//Generic module loading
const NODECRYPO = require("node:crypto");

//Program constants
const COOKIE_VALUE_LENGTH = 16;

class Cookie {

	/*
	 * name : name of the cookie
	 * domain : domain to set on the cookie (must match server domain name)
	 * secure : boolean to set secure flag (true secure flag set, false not set) 
	 */
	constructor (name, domain, secure){
		
		this._name = name;
		this._value = "";
		this._options = new Object();
		this._options.domain = domain;
		this._options.httpOnly = true;
		this._options.secure = secure;
		this._options.expires = 0;
		this._options.sameSite = "Lax";
			
	}

	//Getter for cookie name
	get name (){
		return this._name;
	}

	//Getter for cookie value
	get value (){
		return this._value;
	}

	//Getter for cookie options
	get options (){
		return this._options;
	}

	//Setter for cookie value attribute
	set value (value){

		this._value = value;
	}

	/*
	 * Generate cookie value
	 * callback function which takes
	 * 	a boolean error value set to true if an error occured, false otherwise
 	 * 	the newly created cookie value (if no error only)
	 */
	static generateCookieValue(callback, logger){
		
		NODECRYPO.randomBytes(COOKIE_VALUE_LENGTH, function(err, buf){

			if (!err){
				if (logger != undefined){
                          	      logger.debug("cookie", "New cookie value generated");
                		}
				 callback(false,buf.toString("hex"));

			} else {
				if (logger != undefined){
                                      logger.error("cookie", "Failed to generate a new cookie value");
                                }
				callback(true);
			}
		});

	}

	//Take a users sessions MAP and add the cookie value to it along with the corresponding username
	registerCookie(usersSessionsTable, username, logger){
		
		if (logger != undefined){
                	logger.debug("cookie", "New user session registered");
                }
		usersSessionsTable.set(this._value, username);
	}


	//Take a users sessions MAP and remove the cookie value from it
        unregisterCookie(usersSessionsTable, logger){

                if (logger != undefined){
                        logger.debug("cookie", "User session unregistered");
                }
                usersSessionsTable.delete(this._value);
        }


	//Take a users sessions MAP and check if the cookie value is part of it
	checkCookieValidity(usersSessionsTable, logger){
		
		if (logger != undefined){
                	logger.debug("cookie", "Cookie validity assessed");
                }
		return usersSessionsTable.has(this._value);
	}


	/* Parse cookie from HTTP headers
	 * cookieHeaders: the raw cookieHeader value extracted from the request
	 * cookieName: name of the cookie to look for
	 * domain: domain on which the cookie is set
	 * secure: a boolean set to true to set the secure flag, false otherwise
	 * returns
	 * 	a boolean set to true if the cookie has been found, else if not
	 *	the found cookie as a Cookie object if found
	 */
	static parseCookie(cookieHeaders, cookieName, domain, secure, logger){

		var found = false;
		var authCookie = "";
		var cookieList = cookieHeaders.split(";");
		for (var index=0; index < cookieList.length; index++) {
			if (cookieList[index].split("=")[0].trim() == cookieName){
				
				if (logger != undefined){
                               		logger.debug("cookie", "Authentication cookie found, starting extraction");
                       		}		

				authCookie = new Cookie(cookieName, domain, secure); 
				authCookie.value = cookieList[index].split("=")[1].trim();
				found = true;
				break;
			}
		}

		return {found: found, authCookie: authCookie};
	}

}


//Export section
module.exports = Cookie;
