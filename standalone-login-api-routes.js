import express from 'express';
import { statusCodeFromEx , nullOrEmptyObject } from "./generic-express-util.js";
const apiRouter = express.Router();

import userDao from './standalone-user-dao-mongoose.js';
var PersistentLoginModel = userDao.ThisPersistentModel; //to use only for specific extra request (not in dao)

import jwtUtil from './jwt-util.js';



//submitting authRequest (login) via post
//response = authResponse with token:
// http://localhost:8233/standalone-login-api/v1/public/auth en mode post
// avec { "username" : "admin1" , "password" : "pwd1" } dans req.body
apiRouter.route(['/standalone-login-api/v1/public/auth',
                 '/standalone-login-api/public/auth' ])
.post(async function(req , res  , next ) {
	let  authReq  =  req.body;
	let  authResponse  = {username : authReq.username ,
        status : null , message : null, 
        token : null };
	console.log("POST,authReq="+JSON.stringify(authReq));
	try{
		let login=null;
		let criteria={ username : authReq.username };
		let users = await userDao.findByCriteria(criteria);
		if(users.length==1)
		   login= users[0];
		if(login && login.newPassword == authReq.password){
			authResponse.message="successful login";
			switch(login.mainGroup){
				case "admin_of_sandboxrealm":
					authResponse.scope="resource.read resource.write resource.delete"; break;
				case "manager_of_sandboxrealm":
					authResponse.scope="resource.read resource.write"; break;
				case "user_of_sandboxrealm":
				default:
					authResponse.scope="resource.read";
			}
			authResponse.status=true;
			authResponse.token=jwtUtil.buildJwtToken(login.id,authReq.username,authResponse.scope,login.firstName,login.lastName,login.email);
			res.send(authResponse);
		}else{
			authResponse.message="login failed (wrong password)";
			authResponse.status=false;
			res.status(200).send(authResponse);
		}
	
    } catch(ex){
		console.log("ex="+ex+" "+JSON.stringify(ex))
		authResponse.message="login failed (wrong username)";
        authResponse.status=false;
	    res.status(200).send(authResponse);
    } 
});



export  default { apiRouter };