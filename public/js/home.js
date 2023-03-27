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
		
		dataHtml+= "<div class=\"col-3 wm-container\">";
		dataHtml+= "<h3>" + data[index].name  + "</h3>";
		dataHtml+= "<p>" + data[index].image + "</p>";
		dataHtml+= "<p><span class=\"" + data[index].imageHtmlClass.htmlClass + " fa-2xl wm-container-icon\"></span></p>";
		dataHtml+= "<p><span class=\"wm-container-status " + data[index].stateHtmlClass.htmlClass + "\">" + data[index].state.toUpperCase() + "</span></p>";
		dataHtml+= "</div>";
		elementsInRow++;
		
	}
	dataHtml+= "</div>";	
	document.getElementById("mainContent").innerHTML = dataHtml;
};


//Displays loadbar and triggers API call
function loadContent () {

	document.getElementById("mainContent").innerHTML = "<div class=\"row wm-loader-row\"><div class=\"col-2 offset-5 wm-loader\"></div></div>";
	setTimeout(getContainersList, "2500");
}


//Refresh button function
document.getElementById("refreshButton").addEventListener("click", loadContent);

//Load content when home page opens
loadContent();
