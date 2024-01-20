//Class representing an image object
class Image {

	/*
	 * repoId : image repo digest from registry
	 * repoTag : image repo tag name
	 * created : image creation timestamp on the system (epoch time format)
	 */
	constructor (repoId, repoTag, created){
		this.repoId = repoId;
		this.repoTag = repoTag;
		this.created = created;
	}

	/*
 	 * Take a raw JSON formatted list from dockerAPI and creates an Image list
	 */
	static jsonToImages (jsonRaw, logger){
		
		var rawList = JSON.parse(jsonRaw);
		var enhancedList = [];
		for ( var index=0; index < rawList.length; index++ ) {
			var current = rawList[index];
			if (current.RepoDigests[0] == undefined){
				current.RepoDigests[0] = "no digest ID - built locally";
			}
			var newImage = new Image(current.RepoDigests[0], current.RepoTags[0], current.Created);
			enhancedList.push(newImage);
		}

		if (logger != undefined){
                        logger.debug("container", "Converting Json to a list of Images");
                }

		return enhancedList;
	}

}


//Export section
module.exports = Image;
