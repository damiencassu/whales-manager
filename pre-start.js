//Generic module loading
const FS = require("node:fs");
const PATH = require("node:path");

// Template related constants
const TEMPLATE_DIR = "templates";
const TEMPLATE_FILES = ["server.json.template", "users.json.template","ca.cfg.template", "cacert.cfg.template", "servweb.cfg.template"];

// Logs related constants
const LOG_DIR = "logs";

// Conf related constants
const CONF_DIR = "conf";

//Cert related constants
const CERTS_DIR = "certs";
const CERTS_MANAGER_DIR = "manager";
const CERTS_AGENTS_DIR = "agents";
const CERTS_CUSTOM_DIR = "custom";
const CERTS_TEMPLATE_FILES = ["cadb.txt.template", "cadb.txt.attr.template", "ca.srl.template"];

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
for ( var index=0; index < CERTS_TEMPLATE_FILES.length; index++ ) {

	        if (!FS.existsSync(PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR, CERTS_TEMPLATE_FILES[index].replace(/.template/g, '')))) {
			                FS.copyFileSync(PATH.join(__dirname, TEMPLATE_DIR, CERTS_TEMPLATE_FILES[index]), PATH.join(__dirname, CERTS_DIR, CERTS_MANAGER_DIR, CERTS_TEMPLATE_FILES[index].replace(/.template/g, '')));
			        }
}


//Deploy file templates if not present in conf dir
for ( var index=0; index < TEMPLATE_FILES.length; index++ ) {
	
	if (!FS.existsSync(PATH.join(__dirname, CONF_DIR, TEMPLATE_FILES[index].replace(/.template/g, '')))) {
		FS.copyFileSync(PATH.join(__dirname, TEMPLATE_DIR, TEMPLATE_FILES[index]), PATH.join(__dirname, CONF_DIR, TEMPLATE_FILES[index].replace(/.template/g, '')));
	}
}
