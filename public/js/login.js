//Post user credentials and handle error
async function sendCredentials () {
	var creds = new Object();
	creds.id = document.getElementById("userID").value;
	creds.pwd = document.getElementById("userPassword").value;
	var res = await fetch("/sys/login", {
						method: "POST", 
						headers: {
							"Content-Type": "application/json"
							},
						redirect: "manual",
						body: JSON.stringify(creds)
					});
	if (res.status == 200){
		var data = await res.json();	
		window.location.href = data.location;

	} else {
		document.getElementById("userID").value = "";
		document.getElementById("userPassword").value = "";
		document.getElementById("wm-login-button").innerHTML = "Log In";
		document.getElementById("wm-login-button").disabled = false;
		document.getElementById("loginErrorMessage").hidden = false; 
	}
}

//Handles login button login animation and triggers credentials post
function login () {

	document.getElementById("wm-login-button").disabled = true;
	document.getElementById("wm-login-button").innerHTML = "<span class=\"wm-loading-dots\"><span></span><span></span><span></span></span>";
	//Post credentials
	setTimeout(sendCredentials, "1000");
}


//Main
window.onload = function() {

	//Login button function
	document.getElementById("wm-login-button").addEventListener("click", login);
	document.addEventListener("keydown", function(e){
		
		if(e.keyCode == 13 && !document.getElementById("wm-login-button").disabled){
			login();
		}
	});
}
