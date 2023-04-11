//The logger module offers a simple file logging module object and functions for server messages

//Generic module loading
const FS = require("node:fs");
	
//Supported log levels
const LEVELS = {
	error: 0,
	warn: 1,
	info: 2,
	debug: 3,
	default: 2
};

const LEVELS_REVERSE = {
	0: "error",
	1: "warn",
	2: "info",
	3: "debug"
};

class Logger {
	
	/*
 	 * logLevel: maximum message level to log on the log file
 	 * logFilePath: path to the log file to write logs to
 	 */ 
	constructor (logLevel, logFilePath) {

		if(LEVELS[logLevel] == undefined){
			this._logLevel = LEVELS.default;
		} else {
			this._logLevel = LEVELS[logLevel];
		}
		this._sysLogStream = FS.createWriteStream( logFilePath, {flags: "a"});

	}

	// Setter for logLevel attribute
	set logLevel (value){

		if(LEVELS[value] != undefined){
			this._logLevel = LEVELS[value];
                }
	}

	// Getter for logLevel attribute
	get logLevel (){
		return LEVELS_REVERSE[this._logLevel];
	}

	
	// Log messages with the error level for the given calling module
	error (module, message) {

                if(this._logLevel >= LEVELS.error) {

                        this._sysLogStream.write(new Date(Date.now()).toUTCString() + " - " + "ERROR" + " - " + module.toUpperCase() + " - " + message + "\n");
                }

        }

	
	// Log messages with the warn level for the given calling module
	warn (module, message) {

                if(this._logLevel >= LEVELS.warn) {

                        this._sysLogStream.write(new Date(Date.now()).toUTCString() + " - " + "WARN" + " - " + module.toUpperCase() + " - " + message + "\n");
                }

        }

	// Log messages with the info level for the given calling module
	info (module, message) {
		
		if(this._logLevel >= LEVELS.info) {

			this._sysLogStream.write(new Date(Date.now()).toUTCString() + " - " + "INFO" + " - " + module.toUpperCase() + " - " + message + "\n"); 
		}

	}

	// Log messages with the debug level for the given calling module
	debug (module, message) {

                if(this._logLevel >= LEVELS.debug) {

                        this._sysLogStream.write(new Date(Date.now()).toUTCString() + " - " + "DEBUG" + " - " + module.toUpperCase() + " - " + message + "\n");
                }

        }

}

//Export section
module.exports = Logger;
