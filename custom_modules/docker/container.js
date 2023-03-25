const ContainerVolume = require("./containerVolume");
const ContainerNetwork = require("./containerNetwork");

//Class representing a container instance
class Container {
	/*
	   id : container unique identifier
	   name : container name
	   image : container image name
	   creationDate : container creation date (epoch)
	   state : container state
	   stateDuration : duration of the current container state
	   networks : list of ContainerNetwork objects
	   volumes : list of ContainerVolume objects
	*/
	constructor(id, name, image, creationDate, state, stateDuration, networks, volumes){
		this.id = id;
		this.name = name;
		this.image = image;
		this.creationDate = creationDate;
		this.state = state
		this.stateDuration = stateDuration;
		this.networks = networks;
		this.volumes = volumes;	
	}	 

}


//Exported Class
module.exports = Container;

//Exported Functions

//Exported Values

