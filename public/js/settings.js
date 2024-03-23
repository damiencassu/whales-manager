//Call API to retrieve system infos and docker engine version
async function getSystemEngineInfos(){
	
	var resSI = await fetch("/api/systemInfo");
        var resEI = await fetch("/api/engineInfo");
        var dataHtml = "";
        if (resSI.status == 200 && resEI.status == 200) {
                var dataSI = await resSI.json();
	        var dataEI = await resEI.json();

                dataHtml = "<div><h3 class=\"wm-settings-title\">System Informations <i class=\"wm-icons wm-icons-motherboard\"></i></h3>";
		dataHtml += "<p><strong>Operating System: </strong>" + dataSI.OperatingSystem + "</p>";
		dataHtml += "<p><strong>Operating System Version: </strong>" + dataSI.OSVersion + "</p>";
		dataHtml += "<p><strong>Kernel Version: </strong>" + dataSI.KernelVersion + "</p>";
		dataHtml += "<p><strong>Architecture: </strong>" + dataSI.Architecture + "</p>";
		dataHtml += "<p><strong>CPU Number: </strong>" + dataSI.NCPU + "</p>";
		dataHtml += "<p><strong>RAM: </strong>" + dataSI.MemTotal + " Bytes (" + dataSI.MemTotal / 1000000000 + " GB)</p>";
		dataHtml += "<h3 class=\"wm-settings-title\">Docker Engine <i class=\"wm-icons wm-icons-docker\"></i></h3>";
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

//Call API to change native user username
async function sendNewUserName(){

        var creds = new Object();
        creds.id = document.getElementById("userID").value;
        var res = await fetch("/sys/changeUsername", {
                                                method: "POST",
                                                headers: {
                                                        "Content-Type": "application/json"
                                                        },
                                                redirect: "manual",
                                                body: JSON.stringify(creds)
                                        });
        if (res.status == 200){
                document.getElementById("userID").value = "";
                document.getElementById("wm-chg-username-button").innerHTML = "Change";
                document.getElementById("changeUsernameMessage").innerHTML = "<h3 class=\"fs-6 wm-chg-message-success\">Username change registered, restart Whales Manager to apply it</h3>";
        } else {
                document.getElementById("userPassword").value = "";
                document.getElementById("wm-chg-username-button").innerHTML = "Change";
                document.getElementById("changeUsernameMessage").innerHTML = "<h3 class=\"fs-6 wm-chg-message-error\">Username change failed</h3>";
        }

	document.getElementById("wm-chg-username-button").disabled = false;

}

//Call API to change native user password
async function sendNewUserPassword(){
	
	var creds = new Object();
	creds.pwd = document.getElementById("userPassword").value;
	var res = await fetch("/sys/changePassword", {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
							},
						redirect: "manual",
						body: JSON.stringify(creds)
					});
	if (res.status == 200){
		document.getElementById("userPassword").value = "";
                document.getElementById("wm-chg-password-button").innerHTML = "Change";
                document.getElementById("changePasswordMessage").innerHTML = "<h3 class=\"fs-6 wm-chg-message-success\">Password change registered, restart Whales Manager to apply it</h3>";
	} else {
		document.getElementById("userPassword").value = "";
		document.getElementById("wm-chg-password-button").innerHTML = "Change";
		document.getElementById("changePasswordMessage").innerHTML = "<h3 class=\"fs-6 wm-chg-message-error\">Password change failed</h3>";
	}

	document.getElementById("wm-chg-password-button").disabled = false;

}

//Handles button load animation
function setSpinner(buttonID) {

	document.getElementById(buttonID).disabled = true;
	document.getElementById(buttonID).innerHTML = "<span class=\"wm-loading-dots\"><span></span><span></span><span></span></span>";

}

//Call API to push new username
async function changeUsername() {

	setSpinner("wm-chg-username-button");
	setTimeout(sendNewUserName, "2500");
}

//Call API to push new username                                                                                                                                                        
async function changePassword() {

	setSpinner("wm-chg-password-button");
	setTimeout(sendNewUserPassword, "2500");
}


async function getNativeAuthenticationInfos() {

	var res = await fetch("/sys/authenticationStatus");
        var dataHtml = "";
	if (res.status == 200) {
		var data = await res.json();

		dataHtml = "<div><h3 class=\"wm-settings-title\">Change native account username <i class=\"wm-icons wm-icons-person\"></i></h3>";
		dataHtml += "<form class=\"row g-3\"><div class=\"col-auto\"><input type=\"text\" placeholder=\"Enter new username\" class=\"form-control\" id=\"userID\"></div><div class=\"col-auto\"><button type=\"button\" id=\"wm-chg-username-button\" class=\"btn wm-chg-button\">Change</button></div><div id=\"changeUsernameMessage\" class=\"col-auto\"></div></form><i>Authorized charaters are A-Z, a-z and 0-9</i>";
		dataHtml += "<h3 class=\"wm-settings-title\">Change native account password <i class=\"wm-icons wm-icons-key\"></i></h3>"
		dataHtml += "<form class=\"row g-3\"><div class=\"col-auto\"><input type=\"password\" placeholder=\"Enter new password\" class=\"form-control\" id=\"userPassword\"></div><div class=\"col-auto\"><button type=\"button\" id=\"wm-chg-password-button\" class=\"btn wm-chg-button\">Change</button></div><div id=\"changePasswordMessage\" class=\"col-auto\"></div></form><i>Password must be 12 characters long at least</i>";
		dataHtml += "<h3 class=\"wm-settings-title\">Native authentication status <i class=\"wm-icons wm-icons-shieldlock\"></i></h3>";
		if(data.enabled){
			dataHtml += "<form class=\"row g-3 align-items-center\"><div class=\"col-auto\"><div class=\"alert alert-success\" role=\"alert\"><strong>The Authentication Module is Enabled</strong></div></div></form>";
		} else {
			dataHtml += "<form class=\"row g-3 align-items-center\"><div class=\"col-auto\"><div class=\"alert alert-danger\" role=\"alert\"><strong>The Authentication Module is Disabled</strong></div></div></form>";
		}
		dataHtml += "</div>";

	} else {

		 dataHtml = "<span> Fail to retreive authentication status, try later </span>";
	}

	document.getElementById("mainContent").innerHTML = dataHtml;
	document.getElementById("wm-chg-username-button").addEventListener("click", changeUsername);
	document.getElementById("wm-chg-password-button").addEventListener("click", changePassword);


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

//Displays loadbar and triggers API call to get authentication status and load native forms
function loadNativeAuthenticationInfos() {

	setLoadBar();
        setTimeout(getNativeAuthenticationInfos, "2500");
}


//Main
window.onload = function() {

	//Docker System-Engine button functions
	document.getElementById("docker-system-engine").addEventListener("click", loadDockerSystemEngineInfos);
	document.getElementById("docker-installed-images").addEventListener("click", loadDockerImageList);

	//Authentication button functions
	document.getElementById("authentication-native").addEventListener("click", loadNativeAuthenticationInfos);
}
