//Call API to start a container
function startContainer (eventTarget) {

	eventTarget.currentTarget.className = "wm-container-controls-loading wm-start bi bi-play-circle";
}	

//Call API to stop a container
function stopContainer (eventTarget) {

        eventTarget.currentTarget.className = "wm-container-controls-loading wm-stop bi bi-stop-circle";
}


//Call API to restart a container
function restartContainer (eventTarget) {

	eventTarget.currentTarget.className = "wm-container-controls-loading wm-restart bi bi-arrow-clockwise";
}


//Call API to get the containers list and update frontend accordingly
async function getContainersList () {
	var res = await fetch("/api/containersList");
	var data = await res.json();

	var dataHtml = "<div class=\"row\">";
	var elementsInRow = 0;
	for (var index=0; index < data.length; index++) {
		if (elementsInRow >= 3) {
			dataHtml+= "</div>";
                        dataHtml += "<div class=\"row\">";
                        elementsInRow = 0;
		}
		
		dataHtml+= "<div class=\"col-3 wm-container\" id=\"" + data[index].id + "\">";
		dataHtml+= "<h3 class=\"wm-container-text\">" + data[index].name  + "</h3>";
		dataHtml+= "<p class=\"wm-container-text\">" + data[index].image + "</p>";
		dataHtml+= "<p><span class=\"" + data[index].imageHtmlClass.htmlClass + " fa-2xl wm-container-icon\"></span></p>";
		dataHtml+= "<p><span class=\"wm-container-status " + data[index].stateHtmlClass.htmlClass + "\">" + data[index].state.toUpperCase() + "</span></p>";
		dataHtml+= "<h4><span class=\"wm-container-controls wm-start bi bi-play-circle\"></span><span class=\"wm-container-controls wm-stop bi bi-stop-circle\"></span><span class=\"wm-container-controls wm-restart bi bi-arrow-clockwise\"></span></h4>";
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
		startControls[index].addEventListener("click", startContainer);
	}

	for (var index=0; index < stopControls.length; index++) {
		stopControls[index].addEventListener("click", stopContainer);
	}

	for (var index=0; index < restartControls.length; index++) {
	        restartControls[index].addEventListener("click", restartContainer);
	}
};

//Call API to check if updates are availables
async function checkUpdate () {
	var res = await fetch("/api/checkUpdate");
        var data = await res.json();
	var dataHtml = "";
	if (data.error) {
		dataHtml = "<span> Update checker failed, try later </span>"; 

	} else if (data.update) {
		dataHtml = "<span> Update available : " + data.latest + "</span>";

	} else {
		dataHtml = "<span> No update available </span>"; 

	}

	document.getElementById("wm-update-result").innerHTML = dataHtml;
	document.getElementById("wm-update-button").innerHTML = "Check for updates";
}


//Displays loadbar and triggers API call
function loadContent () {

	document.getElementById("mainContent").innerHTML = "<div class=\"row wm-loader-row\"><div class=\"col-2 offset-5 wm-loader\"></div></div>";
	setTimeout(getContainersList, "2500");
}



//Handles update button load animation and triggers API call
function loadUpdate () {

	document.getElementById("wm-update-button").innerHTML = "<span class=\"spinner-grow wm-spinner-grow\" role=\"status\"></span><span>  </span><span class=\"spinner-grow wm-spinner-grow\" role=\"status\"></span><span>  </span><span class=\"spinner-grow wm-spinner-grow\" role=\"status\"></span>";
	//Api call to check update
	checkUpdate();
}


//Refresh button function
document.getElementById("refreshButton").addEventListener("click", loadContent);

//Update button function
document.getElementById("wm-update-button").addEventListener("click", loadUpdate);


//Load content when home page opens
loadContent();
