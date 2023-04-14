//Generic module loading
const FS = require("node:fs");
const PATH = require("node:path");

// Template related constants
const TEMPLATE_DIR = "templates";
const TEMPLATE_CONF = "server.json.template";

// Logs related constants
const LOG_DIR = "logs";

// Conf related constants
const CONF_DIR = "conf";

//Create local logs directory if needed
if (!FS.existsSync(PATH.join(__dirname, LOG_DIR))){
        FS.mkdirSync(PATH.join(__dirname, LOG_DIR));
}


//Deploy file templates if needed - mandatory in dockerized setups
if (!FS.existsSync(PATH.join(__dirname, CONF_DIR, TEMPLATE_CONF))) {
	FS.copyFileSync(PATH.join(__dirname, TEMPLATE_DIR, CONF_DIR, TEMPLATE_CONF), PATH.join(__dirname, CONF_DIR, TEMPLATE_CONF));
}
