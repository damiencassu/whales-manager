//The httpLogger module acts as an express middleware and offers a simple way to log HTTP requests in file

/*
 * streamToLogFile: a write stream to the file to log HTTP logs to
 * userIDAttribute: req attribute name where the httpLogger middleware has to look for the user ID (if empty, "anonymous" will be logged instead)
 */ 
function httpLogger(streamToLogFile, userIDAttribute){

	return function(req, res, next) {

		var userID = req[userIDAttribute] || "anonymous";

		res.on("finish", function(){
			streamToLogFile.write(new Date(Date.now()).toUTCString() + " - " + req.ip + " - " + userID + " - " + req.method + " - " + req.path + " - " + this.statusCode + "\n");
		});
  		next();
	};
}

//Export section
module.exports = httpLogger;
