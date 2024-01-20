//Call API to retrieve system infos and docker engine version
async function getSystemEngineInfos(){
	
	var resSI = await fetch("/api/systemInfo");
        var resEI = await fetch("/api/engineInfo");
        var dataHtml = "";
        if (resSI.status == 200 && resEI.status == 200) {
                var dataSI = await resSI.json();
	        var dataEI = await resEI.json();

                dataHtml = "<div><h3 class=\"wm-system-title\">System Informations <i class=\"bi bi-motherboard-fill\"></i></h3>";
		dataHtml += "<p><strong>Operating System: </strong>" + dataSI.OperatingSystem + "</p>";
		dataHtml += "<p><strong>Operating System Version: </strong>" + dataSI.OSVersion + "</p>";
		dataHtml += "<p><strong>Kernel Version: </strong>" + dataSI.KernelVersion + "</p>";
		dataHtml += "<p><strong>Architecture: </strong>" + dataSI.Architecture + "</p>";
		dataHtml += "<p><strong>CPU Number: </strong>" + dataSI.NCPU + "</p>";
		dataHtml += "<p><strong>RAM: </strong>" + dataSI.MemTotal + " Bytes (" + dataSI.MemTotal / 1000000000 + " GB)</p>";
		dataHtml += "<h3 class=\"wm-system-title\">Docker Engine <i class=\"fa-brands fa-docker\"></i></h3>";
		dataHtml += "<p><strong>Engine Version: </strong>" + dataEI.Version + "</p>";
		dataHtml += "<p><strong>Max API Version: </strong>" + dataEI.MaxApiVersion + "</p>";
		dataHtml += "<p><strong>Used API Version: </strong>" + dataEI.UsedApiVersion + "</p>"; 
		dataHtml += "</div>";

        } else {

                dataHtml = "<span> Fail to retreive system and engine infos, try later </span>";
        }

        document.getElementById("mainContent").innerHTML = dataHtml;

}

//Call API to retrieve the list of images installed on the host
async function getImageList() {

	var resIL = await fetch("/api/imagesList");
	var dataHtml = "";
	if (resIL.status == 200) {
		var data = await resIL.json();
		var time = "";

		dataHtml = "<table class=\"table\"><thead class=\"table-dark\"><tr><th scope=\"col\">Image Tag</th><th scope=\"col\">Repository Digest ID</th><th scope=\"col\">Image Creation Date</th></tr></thead><tbody>";

		for (var index=0; index < data.length; index++){
			
			time = new Date(data[index].created * 1000);	
			dataHtml += "<tr class=\"wm-image-row\"><th scope=\"row\">" + data[index].repoTag + "</th><td>" + data[index].repoId + "</td><td>" + time.toLocaleString() + "</td></tr>";

		}
		
		dataHtml += "</tbody></table>";
	
	} else {

		dataHtml = "<span> Fail to retreive image list, try later </span>";

	}

	document.getElementById("mainContent").innerHTML = dataHtml;

}


//Displays loadbar
function setLoadBar() {
	
	document.getElementById("mainContent").innerHTML = "<div class=\"row wm-loader-row\"><div class=\"col-2 offset-5 wm-loader\"></div></div>";
}


//Displays loadbar and triggers API call to get system and engine infos
function loadDockerSystemEngineInfos() {

	setLoadBar();
	setTimeout(getSystemEngineInfos, "2500");
}

//Displays loadbar and triggers API call to get list of installed images
function loadDockerImageList() {

        setLoadBar();
        setTimeout(getImageList, "2500");
}

//Docker System-Engine button function
document.getElementById("docker-system-engine").addEventListener("click", loadDockerSystemEngineInfos);
document.getElementById("docker-installed-images").addEventListener("click", loadDockerImageList);
