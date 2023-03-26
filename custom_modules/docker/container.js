//Class representing a container instance
class Container {
	/*
	   id : container unique identifier
	   name : container name
	   image : container image name
	   imageHtmlClass : css class to apply on the container for its icon on the frontend
	   state : container state
	   stateHtmlClass : css class to apply on the container for its status on the frontend
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
 	   Take a raw JSON formatted list from dockerAPI and creates a Container list
	   IconsDB and StatusDB properties must be provided
	*/
	static jsonToContainer (jsonRaw, iconsDB, stateDB){
		var rawList = JSON.parse(jsonRaw);
		var enhancedList = [];
		for ( var index=0; index < rawList.length; index++ ) {
			var current = rawList[index];
			var newContainer = new Container(current.Id, current.Names[0], current.Image, iconsDB[current.Image.split(/[:\/]/)[0]], current.State, stateDB[current.State]);
			enhancedList.push(newContainer);
		}
		return enhancedList;
	}
}


//Exported Class
module.exports = Container;

//Exported Functions

//Exported Values

