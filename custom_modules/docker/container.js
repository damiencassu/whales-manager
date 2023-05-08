//Custom module loading
const LOGGER_SYS = require("../core/logger");

//Class representing a container instance
class Container {
	/*
	 * id : container unique identifier
	 * name : container name
	 * image : container image name
	 * imageHtmlClass : css class to apply on the container for its icon on the frontend
	 * state : container state
	 * stateHtmlClass : css class to apply on the container for its status on the frontend
	 */
	constructor (id, name, image, imageHtmlClass, state, stateHtmlClass){
		this.id = id;
		this.name = name;
		this.image = image;
		this.imageHtmlClass = imageHtmlClass;
		this.state = state
		this.stateHtmlClass = stateHtmlClass;
	}

	/*
 	* Take a raw JSON from dockerAPI and creates a Container
	* IconsDB and StatusDB properties must be provided
 	*/	
	 
	static jsonToContainer (jsonRaw, iconsDB, stateDB, logger){
	
		var rawContainer = JSON.parse(jsonRaw);
		var currentIcon = "";
		if (iconsDB[rawContainer.Image.split(/[:\/]/)[0]] == undefined){
			currentIcon = iconsDB.default;
		} else {
			currentIcon = iconsDB[rawContainer.Image.split(/[:\/]/)[0]];
		}

		var newContainer = new Container(rawContainer.Id, rawContainer.Name.split("/")[1], rawContainer.Config.Image, currentIcon, rawContainer.State.Status, stateDB[rawContainer.State.Status]);

		if (logger != undefined){
                        logger.debug("container", "Converting Json to container");
                }

		return newContainer;
	}



	/*
 	 * Take a raw JSON formatted list from dockerAPI and creates a Container list
	 * IconsDB and StatusDB properties must be provided
	 */
	static jsonToContainers (jsonRaw, iconsDB, stateDB, logger){
		
		var rawList = JSON.parse(jsonRaw);
		var enhancedList = [];
		for ( var index=0; index < rawList.length; index++ ) {
			var current = rawList[index];
			var currentIcon = "";
			if (iconsDB[current.Image.split(/[:\/]/)[0]] == undefined){
				currentIcon = iconsDB.default;
			} else {
				currentIcon = iconsDB[current.Image.split(/[:\/]/)[0]];
			}

			var newContainer = new Container(current.Id, current.Names[0].split("/")[1], current.Image, currentIcon, current.State, stateDB[current.State]);
			enhancedList.push(newContainer);
		}

		if (logger != undefined){
                        logger.debug("container", "Converting Json to a list of Containers");
                }

		return enhancedList;
	}

	/*
	 * Take a raw container ID string and sanitize it
	 * Return sanitized ID and safe equal true (or just safe equal false if the check/cleaning operation failed) 
	 */
	static sanitizeContainerId (containerId, logger) {

		//A valid container ID must be an hex 64 characters string
		var regex = /^[A-F0-9]{64}$/i;
		if (regex.test(containerId)){

			if (logger != undefined){
				logger.debug("container", "Container ID (" + containerId + ") sanitization OK");
			}

			return {safe: true, id: containerId};

		} else {

			if (logger != undefined){
				logger.debug("container", "Container ID (" + containerId + ") sanitization KO");
			}
			
			return {safe: false};
		}	
	}	
}


//Export section
module.exports = Container;
