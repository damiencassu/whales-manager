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

class Logger {
	
	/*
 	 * logLevel: maximum message level to log on the log file
 	 * logFilePath: path to the log file to write logs to
 	 */ 
	constructor (logLevel, logFilePath) {

		if(LEVELS[logLevel] == undefined){
			this.logLevel = LEVELS.default;
		} else {
			this.logLevel = LEVELS[logLevel];
		}
		this.sysLogStream = FS.createWriteStream( logFilePath, {flags: "a"});

	}

	
	// Log messages with the error level for the given calling module
	error (module, message) {

                if(this.logLevel >= LEVELS.error) {

                        this.sysLogStream.write(new Date(Date.now()).toUTCString() + " - " + "ERROR" + " - " + module.toUpperCase() + " - " + message + "\n");
                }

        }

	
	// Log messages with the warn level for the given calling module
	warn (module, message) {

                if(this.logLevel >= LEVELS.warn) {

                        this.sysLogStream.write(new Date(Date.now()).toUTCString() + " - " + "WARN" + " - " + module.toUpperCase() + " - " + message + "\n");
                }

        }

	// Log messages with the info level for the given calling module
	info (module, message) {
		
		if(this.logLevel >= LEVELS.info) {

			this.sysLogStream.write(new Date(Date.now()).toUTCString() + " - " + "INFO" + " - " + module.toUpperCase() + " - " + message + "\n"); 
		}

	}

	// Log messages with the debug level for the given calling module
	debug (module, message) {

                if(this.logLevel >= LEVELS.debug) {

                        this.sysLogStream.write(new Date(Date.now()).toUTCString() + " - " + "DEBUG" + " - " + module.toUpperCase() + " - " + message + "\n");
                }

        }

}

//Export section
module.exports = Logger;
