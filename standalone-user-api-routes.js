import express from 'express';
import { statusCodeFromEx , nullOrEmptyObject } from "./generic-express-util.js";
import userDao from './standalone-user-dao-mongoose.js';
var PersistentproductModel = userDao.ThisPersistentModel; //to use only for specific extra request (not in dao)

const apiRouter = express.Router();




/*
NB: cette api (plan B) est volontairement compatible avec l'api
http://localhost:8232/user-api/public/xyz en accès public (sans auth nécessaire)
-----
cette version "standalone" fonctionne avec une collection de "users" dans mongoDB
et ne dialogue pas avec un serveur oauth2/oidc
*/


//*******************************************


//exemple URL: http://localhost:8233/standalone-user-api/public/reinit
apiRouter.route(['/standalone-user-api/public/reinit' ])
.get( async function(req , res  , next ) {
	try{
		let doneActionMessage = await userDao.reinit_db();
		res.send(doneActionMessage);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});


//exemple URL: http://localhost:8233/standalone-user-api/public/user/user1
apiRouter.route(['/standalone-user-api/public/user/:username'])
.get( async function(req , res  , next ) {
	var username = req.params.username;
	let criteria={ username : username };
	try{
		let users = await userDao.findByCriteria(criteria);
		console.log("users="+JSON.stringify(users));
		if(users.length==1)
		    res.send(users[0]);
		else
		   res.status(404).send({error : "NOT_FOUND" , reason : "no user with username="+username});
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

//exemple URL: http://localhost:8233/standalone-user-api/public/user (returning all user accounts)
apiRouter.route([ '/standalone-user-api/public/user'])
.get( async function(req , res  , next ) {
	let criteria={};
	try{
		let users = await userDao.findByCriteria(criteria);
		res.send(users);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});



// http://localhost:8233/standalone-user-api/public/user en mode post
// avec {"firstName":"joe","lastName":"Dalton","email":"joe.dalton@jail.com","username":"user4","groups":["user_of_myrealm"],"newPassword":"pwd4"} dans req.body
apiRouter.route([ '/standalone-user-api/public/user'])
.post(async function(req , res  , next ) {
	let newEntity = req.body;
	console.log("POST,newEntity="+JSON.stringify(newEntity));
	if(nullOrEmptyObject(newEntity)) { res.status(400).send(); return; } //BAD REQUEST
	try{
		let savedEntity = await userDao.save(newEntity);
		res.status(201).send(savedEntity);//201: successfully created
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});



// http://localhost:8233/standalone-user-api/public/user en mode PUT
// avec {"firstName":"joe","lastName":"Dalton","email":"joe.dalton@jail.com","username":"user4","groups":["user_of_myrealm"],"newPassword":"pwd4"} dans req.body
apiRouter.route([ '/standalone-user-api/public/user'])
.put( async function(req , res  , next ) {
	let newValueOfEntityToUpdate = req.body;
	console.log("PUT,newValueOfEntityToUpdate="+JSON.stringify(newValueOfEntityToUpdate));
    if(nullOrEmptyObject(newValueOfEntityToUpdate)) { res.status(400).send(); return; } //BAD REQUEST 
	//l'id de l'entity à mettre à jour en mode put peut soit être précisée en fin d'URL
	//soit être précisée dans les données json de la partie body
	//et si l'information est renseignée des 2 façons elle ne doit pas être incohérente:
	let entityId = req.params.id; //may be found (as string) at end of URL
	if(newValueOfEntityToUpdate.id != null && entityId != null 
		&&  newValueOfEntityToUpdate.id != entityId ) { res.status(400).send(); return; } //BAD REQUEST (incoherent id)
	if(newValueOfEntityToUpdate.id == null && entityId != null) newValueOfEntityToUpdate.id = entityId;
	if(newValueOfEntityToUpdate.id != null && entityId == null ) entityId = newValueOfEntityToUpdate.id;

	let noVerbose = req.query.v=="false"; //verbose mode (default as true)
	try{
		let updatedEntity = await userDao.updateOne(newValueOfEntityToUpdate);
		if(!noVerbose)
		  res.send(updatedEntity); //200:OK with updated entity as Json response body
		else
		  res.status(204).send();//NO_CONTENT
    } catch(ex){
		//console.log("ex:" + ex + " -- " + JSON.stringify(ex))
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});


// http://localhost:8233/standalone-user-api/public/user/user1 en mode DELETE
apiRouter.route(['/standalone-user-api/public/user/:username'])
.delete( async function(req , res  , next ) {
	var username = req.params.username;
	console.log("DELETE,username="+username);
	let noVerbose = req.query.v=="false"; //verbose mode (default as true)
	try{
		let deleteActionMessage = await PersistentproductModel.deleteOne({username: username});
		if(!noVerbose)
		  res.send(deleteActionMessage);
		else
		  res.status(204).send();//NO_CONTENT
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});


export  default { apiRouter };