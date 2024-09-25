function authCallback(jsonResponse){
	let authResponse = JSON.parse(jsonResponse);
	document.getElementById("spanMsg").innerText=(authResponse.status ? 'authenticated' : 'not authenticated') + " "
	                                            + authResponse.message;
	console.log("authToken="+ authResponse.token);
	document.getElementById("name").innerText= "? , may be seen in token after parsed";
	document.getElementById("scope").innerText= authResponse.scope;
	sessionStorage.setItem("authToken",authResponse.token);
	sessionStorage.setItem("username", authResponse.status?authResponse.username:"")
}

function errCallback(err) {
	document.getElementById("spanMsg").innerText="not authenticated , login error" ;
	console.log('err='+err);
	sessionStorage.removeItem("authToken"); sessionStorage.removeItem("username");
}

function onLogin(evt){
	document.getElementById("spanMsg").innerText="onLogin";
	let authRequest = { username : document.getElementById("txtUsername").value,
		                password : document.getElementById("txtPassword").value }
    makeAjaxPostRequest("../standalone-login-api/v1/public/auth" ,
	                     JSON.stringify(authRequest), 
						 authCallback , 
						 errCallback);
}

function onLogout(evt){
	document.getElementById("spanMsg").innerText="Logout ok";
	document.getElementById("txtUsername").value="";
	document.getElementById("txtPassword").value="";
	sessionStorage.removeItem("authToken");sessionStorage.removeItem("username");
}


window.onload=function(){
	document.getElementById("btnLogin").addEventListener("click",onLogin);
	document.getElementById("btnLogout").addEventListener("click" ,onLogout);
	let authToken = sessionStorage.getItem("authToken");
	document.getElementById("txtUsername").value=sessionStorage.getItem("username");
	document.getElementById("spanMsg").innerText=(authToken!=null)?"authenticated":"not authenticated" ;
	
}