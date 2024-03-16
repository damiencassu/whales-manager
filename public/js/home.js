//Call API to retrieve Container info
async function getContainerInfo(containerId) {

	//Send the GET request to Whales Manager API
	var res = await fetch("/api/containerInfo/"+ containerId);
        if (res.status == 200) {

                var data = await res.json();
		return data;
        } else {
		return undefined;
	}
}


//Call API to start a container
async function startContainer(eventTarget) {

	//Send the POST request to Whales Manager API
	var res = await fetch("/api/startContainer/"+ eventTarget.srcElement.parentNode.parentNode.id, {method: "POST"});
	if (res.status == 200) {
        	var data = await res.json();
		//If container started sucessfully, then refresh its displayed status
		if (!data.error && data.started){
			var container = await getContainerInfo(eventTarget.srcElement.parentNode.parentNode.id);
			if (container != undefined){
				var state = eventTarget.srcElement.parentNode.parentNode.querySelectorAll(".wm-container-status")[0];
				state.className = "wm-container-status "+ container.stateHtmlClass.htmlClass;
				state.innerHTML = container.state.toUpperCase();
			}
		}
	} 

	//Stop the loading
	eventTarget.srcElement.className = "wm-container-controls wm-start wm-icons wm-icons-play";
}	

//Change the triggered start button display and triggers API call
function loadStartContainer(eventTarget) {
	
	//Put the start button in glowing mode
	eventTarget.srcElement.className = "wm-container-controls-loading wm-start wm-icons wm-icons-play";
	setTimeout(startContainer, "2000", eventTarget);
}

//Call API to stop a container
async function stopContainer(eventTarget) {

	 //Send the POST request to Whales Manager API
	var res = await fetch("/api/stopContainer/"+ eventTarget.srcElement.parentNode.parentNode.id, {method: "POST"});
	if (res.status == 200) {
	        var data = await res.json();
		//If container stopped sucessfully, then refresh its displayed status
		if (!data.error && data.stopped){
                        var container = await getContainerInfo(eventTarget.srcElement.parentNode.parentNode.id);
                        if (container != undefined){
                                var state = eventTarget.srcElement.parentNode.parentNode.querySelectorAll(".wm-container-status")[0];
                                state.className = "wm-container-status "+ container.stateHtmlClass.htmlClass;
                                state.innerHTML = container.state.toUpperCase();
                        }
                }
         }

         //Stop the loading
         eventTarget.srcElement.className = "wm-container-controls wm-stop wm-icons wm-icons-stop";

}

function loadStopContainer(eventTarget) {

	//Put the stop button in glowing mode
        eventTarget.srcElement.className = "wm-container-controls-loading wm-stop wm-icons wm-icons-stop";
        setTimeout(stopContainer, "2000", eventTarget);
}

//Call API to restart a container
async function restartContainer(eventTarget) {

	//Send the POST request to Whales Manager API
	var res = await fetch("/api/restartContainer/"+ eventTarget.srcElement.parentNode.parentNode.id, {method: "POST"});
	if (res.status == 200) {
		var data = await res.json();
		//If container restarted sucessfully, then refresh its displayed status
		if (!data.error && data.restarted){
                        var container = await getContainerInfo(eventTarget.srcElement.parentNode.parentNode.id);
                        if (container != undefined){
                                var state = eventTarget.srcElement.parentNode.parentNode.querySelectorAll(".wm-container-status")[0];
                                state.className = "wm-container-status "+ container.stateHtmlClass.htmlClass;
                                state.innerHTML = container.state.toUpperCase();
                        }
                }
	}

	//Stop the loading
	eventTarget.srcElement.className = "wm-container-controls wm-restart wm-icons wm-icons-restart";
}

//Call API to restart a container
function loadRestartContainer(eventTarget) {

	//Put the restart button in glowing mode
	eventTarget.srcElement.className = "wm-container-controls-loading wm-restart wm-icons wm-icons-restart";
        setTimeout(restartContainer, "2000", eventTarget);
}


//Call API to get the containers list and update frontend accordingly
async function getContainersList() {
	var res = await fetch("/api/containersList");
	if (res.status == 200) {
		var data = await res.json();

		var dataHtml = "<div class=\"row d-flex justify-content-evenly\">";
		var elementsInRow = 0;
		for (var index=0; index < data.length; index++) {
			if (elementsInRow >= 3) {
				dataHtml+= "</div>";
                        	dataHtml += "<div class=\"row d-flex justify-content-evenly\">";
                        	elementsInRow = 0;
			}
		
			dataHtml+= "<div class=\"col-3 wm-container\" id=\"" + data[index].id + "\">";
			dataHtml+= "<h3 class=\"wm-container-text\">" + data[index].name  + "</h3>";
			dataHtml+= "<p class=\"wm-container-text\">" + data[index].image + "</p>";
			dataHtml+= "<p><span class=\"" + data[index].imageHtmlClass.htmlClass + " wm-2xl wm-container-icon\"></span></p>";
			dataHtml+= "<p><span class=\"wm-container-status " + data[index].stateHtmlClass.htmlClass + "\">" + data[index].state.toUpperCase() + "</span></p>";
			dataHtml+= "<h4><span class=\"wm-container-controls wm-start wm-icons wm-icons-play\"></span><span class=\"wm-container-controls wm-stop wm-icons wm-icons-stop\"></span><span class=\"wm-container-controls wm-restart wm-icons wm-icons-restart\"></span></h4>";
			dataHtml+= "</div>";
			elementsInRow++;
		
		}
		dataHtml+= "</div>";	
		document.getElementById("mainContent").innerHTML = dataHtml;
	
		//Enable controls
		var startControls = document.getElementsByClassName("wm-start");
		var stopControls = document.getElementsByClassName("wm-stop");
		var restartControls = document.getElementsByClassName("wm-restart");

		for (var index=0; index < startControls.length; index++) {
			startControls[index].addEventListener("click", loadStartContainer);
		}

		for (var index=0; index < stopControls.length; index++) {
			stopControls[index].addEventListener("click", loadStopContainer);
		}

		for (var index=0; index < restartControls.length; index++) {
	        	restartControls[index].addEventListener("click", loadRestartContainer);
		}

	} else {
		var errorHtml = "<div><p>Failed to retrieve container list - please retry</p></div>"; 
		document.getElementById("mainContent").innerHTML = errorHtml;
	}
};

//Call API to check if updates are availables
async function checkUpdate() {
	var res = await fetch("/sys/checkUpdate");
	var dataHtml = "";
	if (res.status == 200) {
        	var data = await res.json();
		if (data.error) {
			dataHtml = "<span> Update checker failed, try later </span>"; 

		} else if (data.update) {
			dataHtml = "<span> Update available : " + data.latest + "</span>";

		} else {
			dataHtml = "<span> No update available </span>"; 

		}
	} else {
	
		dataHtml = "<span> Update checker failed, try later </span>";
	}

	document.getElementById("wm-update-result").innerHTML = dataHtml;
	document.getElementById("wm-update-button").innerHTML = "Check for updates";
}


//Displays loadbar and triggers API call
function loadContent() {

	document.getElementById("mainContent").innerHTML = "<div class=\"row wm-loader-row\"><div class=\"col-2 offset-5 wm-loader\"></div></div>";
	setTimeout(getContainersList, "2500");
}



//Handles update button load animation and triggers API call
function loadUpdate() {

	document.getElementById("wm-update-button").innerHTML = "<span class=\"wm-loading-dots\"><span></span><span></span><span></span></span>";
	//Api call to check update
	checkUpdate();
}


//Main
window.onload = function() {

	//Refresh button function
	document.getElementById("refreshButton").addEventListener("click", loadContent);

	//Update button function
	document.getElementById("wm-update-button").addEventListener("click", loadUpdate);

	//Enable user popup
	var userPopup = "";
	if(document.getElementById("wm-user-popup-link") != undefined){
		userPopup = new bootstrap.Popover(document.getElementById("wm-user-popup-link"));
	}

	//Load content when home page opens
	loadContent();
}
