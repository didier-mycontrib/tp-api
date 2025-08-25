import express from 'express';
const apiRouter = express.Router();
import userDao from './standalone-user-dao-mongoose.js';
//userDao.ThisPersistentModelFn(); //to use only for specific extra request (not in dao)



import { statusCodeFromEx , nullOrEmptyObject , build_api_uris , 
	    addDefaultPrivateReInitRoute ,
	    addDefaultGetByIdRoute ,addDefaultGetByCriteriaRoute ,
	    addDefaultDeleteRoute , addDefaultPostRoute , addDefaultPutRoute} from "./generic-express-util.js";

const api_name="standalone-user-api"
const api_version="v1"
const main_entities_name="users" // main collection (entities name)  

const api_uris = build_api_uris(api_name,api_version,main_entities_name);


/*
NB: la redirection https://www.d-defrance.fr/xyz-api
     vers  http://localhost:8233/xyz-api est effectuée dans nginx.conf
	 et donc pas besoin de /tp/... dans ce fichier
	 
NB: cette api (plan B) est volontairement compatible avec l'api
http://localhost:8232/user-api/public/xyz en accès public (sans auth nécessaire)
-----
cette version "standalone" fonctionne avec une collection de "users" dans mongoDB
et ne dialogue pas avec un serveur oauth2/oidc

	
*/


//*******************************************



apiRouter.route(['/standalone-user-api/public/reinit' , //old bad public url (before v1)
	'/standalone-user-api/private/reinit',//old bad private url (before v1)
	'/standalone-user-api/v1/public/reinit' , //unsecure public url (for simple call :  TP)
]).get( function(req,res){
   res.redirect(`/standalone-user-api/v1/private/reinit`); //new good restfull url (v1)
});

//exemple URL: http://localhost:8233/standalone-user-api/v1/public/reinit
addDefaultPrivateReInitRoute(apiRouter,userDao,api_uris)



//exemple URL: http://localhost:8233/standalone-user-api/v1/public/users/user1
/**
 * @openapi
 * /standalone-user-api/v1/public/users/{username}:
 *   get:
 *     description: user by username
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: user1
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *         description: Returns user
 *       404:
 *         description: NOT_FOUND
 */

apiRouter.route([ '/standalone-user-api/v1/public/users/:username' ,
				'/standalone-user-api/public/user/:username' ])
.get( async function(req , res  , next ) {
	var username = req.params.username;
	let criteria={ username : username };
	try{
		let users = await userDao.findByCriteria(criteria);
		console.log("users="+JSON.stringify(users));
		if(users.length>=1)
		    res.send(users[0]);
		else
		   res.status(404).send({error : "NOT_FOUND" , reason : "no user with username="+username});
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

apiRouter.route(['/standalone-user-api/public/user' ]) //old bad url (before v1)
.get( function(req,res){
   res.redirect(`/standalone-user-api/v1/public/users`); //new good restfull url (v1)
});

//exemple URL: http://localhost:8233/standalone-user-api/v1/public/users (returning all user accounts)
/**
 * @openapi
 * /standalone-user-api/v1/public/users:
 *   get:
 *     description: get users from optional criteria 
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/UserArray"
 *         description: user list
 */
addDefaultGetByCriteriaRoute(apiRouter,userDao,api_uris,"public")



// http://localhost:8233/standalone-user-api/v1/public/users en mode post
// avec {"firstName":"joe","lastName":"Dalton","email":"joe.dalton@jail.com","username":"user4","groups":["user_of_myrealm"],"newPassword":"pwd4"} dans req.body
/**
 * @openapi
 * /standalone-user-api/v1/private/users:
 *   post:
 *     description: post a new user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/User"
 *     responses:
 *       201:
 *         description: saved user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       500:
 *         description: INTERNAL_SERVER_ERROR
 */
apiRouter.route(['/standalone-user-api/v1/private/users' ,
				'/standalone-user-api/private/user',
			    '/standalone-user-api/v1/public/users' ,
				'/standalone-user-api/public/user'])
.post(async function(req , res  , next ) {
	let newEntity = req.body;
	console.log("POST,newEntity="+JSON.stringify(newEntity));
	if(nullOrEmptyObject(newEntity)) { res.status(400).send(); return; } //BAD REQUEST
	try{
		let criteriaTestDoublon={ username : newEntity.username };
		let usersWithSameUsername = await userDao.findByCriteria(criteriaTestDoublon);
		if(usersWithSameUsername.length>=1){
			res.status(409).send({"error":"CONFLICT","reason":"already one user with username="+newEntity.username});
		}else{
			let savedEntity = await userDao.save(newEntity);
			res.status(201).send(savedEntity);//201: successfully created
		}
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});

//Redirection For bad old version (before v1)
apiRouter.route(['/standalone-user-api/public/user/:id' , //old bad public url (before v1)
	'/standalone-user-api/private/user/:id',//old bad private url (before v1)
	'/standalone-user-api/public/user' , //old very bad public url (before v1)
	'/standalone-user-api/private/user',//old very bad private url (before v1)
	'/standalone-user-api/v1/public/users/:id' , //unsecure public url (for simple call :  TP)
]) 
.put( function(req,res){
   let idRes = req.params.id;
   let newValueOfEntityToUpdate = req.body;
   if(idRes == undefined)
	  idRes=newValueOfEntityToUpdate.code
   res.redirect(`/standalone-user-api/v1/private/users/${idRes}`); //new good restfull url (v1)
});


// http://localhost:8233/standalone-user-api/v1/public/users/.... en mode PUT
// avec {"firstName":"joe","lastName":"Dalton","email":"joe.dalton@jail.com","username":"user4","groups":["user_of_myrealm"],"newPassword":"pwd4"} dans req.body
/**
 * @openapi
 * /standalone-user-api/v1/private/users/{id}:
 *   put:
 *     description: update User with existing id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: 618d53514e0720e69e2e54c8
 *       - name: v
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: "verbose: to ask 200/updateduser (not 204/NO_CONTENT)"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/User"
 *     responses:
 *       200:
 *         description: updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       204:
 *         description: NO_CONTENT (OK)
 *       404:
 *         description: NOT_FOUND
 */
addDefaultPutRoute(apiRouter,userDao,api_uris,
	 (idRes,userToUpdate) => { userToUpdate.code = idRes; }
)



// http://localhost:8233/standalone-user-api/v1/public/users/user1 en mode DELETE
/**
 * @openapi
 * /standalone-user-api/v1/private/users/{username}:
 *   delete:
 *     description: delete user from username
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: user1
 *       - name: v
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: "verbose: to ask 200/message (not 204/NO_CONTENT)"
 *     responses:
 *       200:
 *         description : delete action json message with deletedId
 *       204:
 *         description: NO_CONTENT (OK)
 *       404:
 *         description: NOT_FOUND
 */
apiRouter.route(['/standalone-user-api/v1/public/users/:username',
				'/standalone-user-api/public/user/:username',
			    '/standalone-user-api/v1/private/users/:username',
				'/standalone-user-api/private/user/:username' ])
.delete( async function(req , res  , next ) {
	var username = req.params.username;
	console.log("DELETE,username="+username);
	let noVerbose = req.query.v=="false"; //verbose mode (default as true)
	try{
		let deleteActionMessage = await userDao.ThisPersistentModelFn().deleteOne({username: username});
		if(!noVerbose)
		  res.send(deleteActionMessage);
		else
		  res.status(204).send();//NO_CONTENT
    } catch(ex){
		console.log("delete standalone-user :" + ex)
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});



export  default { apiRouter };