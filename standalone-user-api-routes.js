import express from 'express';
const apiRouter = express.Router();
import userDao from './standalone-user-dao-mongoose.js';
//userDao.ThisPersistentModelFn(); //to use only for specific extra request (not in dao)

import { statusCodeFromEx , nullOrEmptyObject , build_api_uris , 
	    addDefaultPrivateReInitRoute ,  addRedirectPublicToPrivateRoute,
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
/* TP ONLY */
addRedirectPublicToPrivateRoute(apiRouter,"/standalone-user-api/v1/public/reinit",["get"])
addRedirectPublicToPrivateRoute(apiRouter,"/standalone-user-api/v1/public/users/:id",["delete","put"])
addRedirectPublicToPrivateRoute(apiRouter,"/standalone-user-api/v1/public/users",["post"])


//exemple URL: http://localhost:8233/standalone-user-api/v1/public/reinit
addDefaultPrivateReInitRoute(apiRouter,userDao,api_uris)



//exemple URL: http://localhost:8233/standalone-user-api/v1/public/users/user1
/**
 * @openapi
 * /standalone-user-api/v1/public/users/{id}:
 *   get:
 *     description: "user by id (or by username if .../user1?unique_property_name_as_id=username)"
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "618d53514e0720e69e2e54c8 or user1"
 *       - name: unique_property_name_as_id
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: "to search/find a unique user by unique username (instead of by unique generated id)"
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
addDefaultGetByIdRoute(apiRouter,userDao,api_uris,"public")

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
addDefaultPostRoute(apiRouter,userDao,api_uris,
	 (savedUser)=>savedUser.id,
	 null /* no preTranformFn*/ ,
	 async (user)=>{
		let criteriaTestDoublon={ username : user.username };
		let usersWithSameUsername = await userDao.findByCriteria(criteriaTestDoublon);
		if(usersWithSameUsername.length>=1){
			throw {"error":"CONFLICT","reason":"already one user with username="+user.username};
		}
	 } /* optionalUnicityTest */ 
)



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
	 (idRes,userToUpdate) => { userToUpdate.id = idRes; }
)



// http://localhost:8233/standalone-user-api/v1/private/users/user1 en mode DELETE
/**
 * @openapi
 * /standalone-user-api/v1/private/users/{id}:
 *   delete:
 *     description: delete user from id (by default) or by username (if ?unique_property_name_as_id=username)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: 618d53514e0720e69e2e54c8 or user1
 *       - name: unique_property_name_as_id
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: "to search/find a userto delete by unique username (instead of by unique generated id)"
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
addDefaultDeleteRoute(apiRouter,userDao,api_uris) //search and delete by unique username


export  default { apiRouter };