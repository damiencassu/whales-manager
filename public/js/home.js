//Call API to get the containers list and update frontend accordingly
async function getContainersList () {
	var res = await fetch("/api/containersList");
	var data = await res.json();

	var dataHtml = "<div class=\"row\">";
	var elementsInRow = 0;
	for (var index=0; index < data.length; index++) {
		if (elementsInRow < 3) {
			dataHtml+= "<div class=\"col wm-container\">";
			dataHtml+= "<h3>" + data[index].name  + "</h3>";
			dataHtml+= "<p>" + data[index].image + "</p>";
			dataHtml+= "<p><span class=\"" + data[index].imageHtmlClass.htmlClass + " fa-2xl wm-container-icon\"></span></p>";
			dataHtml+= "<p><span class=\"wm-container-status " + data[index].stateHtmlClass.htmlClass + "\">" + data[index].state.toUpperCase() + "</span></p>";
			dataHtml+= "</div>";
			elementsInRow++;
		} else {
			dataHtml+= "</div>";
			dataHtml = "<div class=\"row\">";
			elementsInRow = 0;
		}
	}
	dataHtml+= "</div>";	
	document.getElementById("mainContent").innerHTML = dataHtml;
};

getContainersList();
