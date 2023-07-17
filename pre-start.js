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

//Cert related constants
const CERTS_DIR = "certs";
const CERTS_MANAGER_DIR = "manager";
const CERTS_AGENTS_DIR = "agents";
const CERTS_CUSTOM_DIR = "custom";

//Create local logs directory if needed
if (!FS.existsSync(PATH.join(__dirname, LOG_DIR))){
        FS.mkdirSync(PATH.join(__dirname, LOG_DIR));
}

//Create local conf directory if needed
if (!FS.existsSync(PATH.join(__dirname, CONF_DIR))){
        FS.mkdirSync(PATH.join(__dirname, CONF_DIR));
}

//Create local certs directory if needed
if (!FS.existsSync(PATH.join(__dirname, CERTS_DIR))){
	FS.mkdirSync(PATH.join(__dirname, CERTS_DIR));
}
if (!FS.existsSync(PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR))){
	        FS.mkdirSync(PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR));
}
if (!FS.existsSync(PATH.join(__dirname, CERTS_DIR, CERTS_AGENTS_DIR))){
	        FS.mkdirSync(PATH.join(__dirname, CERTS_DIR, CERTS_AGENTS_DIR));
}
if (!FS.existsSync(PATH.join(__dirname, CERTS_DIR, CERTS_CUSTOM_DIR))){
	        FS.mkdirSync(PATH.join(__dirname, CERTS_DIR, CERTS_CUSTOM_DIR));
}


//Deploy file templates if needed - mandatory in dockerized setups
if (!FS.existsSync(PATH.join(__dirname, CONF_DIR, TEMPLATE_CONF))) {
	FS.copyFileSync(PATH.join(__dirname, TEMPLATE_DIR, CONF_DIR, TEMPLATE_CONF), PATH.join(__dirname, CONF_DIR, TEMPLATE_CONF));
}
