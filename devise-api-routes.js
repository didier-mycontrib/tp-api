import express from 'express';
const apiRouter = express.Router();

import { statusCodeFromEx , nullOrEmptyObject } from "./generic-express-util.js";
import deviseDao from './devise-dao-mongoose.js';
var PersistentDeviseModel = deviseDao.ThisPersistentModel; //to use only for specific extra request (not in dao)

//NB: les api axios ou fetch servent à appeler des WS REST avec des Promises
//const axios = require('axios'); 
import axios from 'axios';// npm install -s axios



/*
NB: la redirection https://www.d-defrance.fr/xyz-api
     vers  http://localhost:8233/xyz-api est effectuée dans nginx.conf
	 et donc pas besoin de /tp/... dans ce fichier


Nouvelle convention d'URL :
http://localhost:8233/devise-api/v1/private/xyz en accès private (avec auth nécessaire)
http://localhost:8233/devise-api/v1/public/xyz en accès public (sans auth nécessaire)
NB: dans vrai projet d'entreprise , public pour get pas confidentiel et private pour tout le reste
    ICI Exceptionnellement EN TP , presques toutes les URLS sont doublées : appelables en public et private

NB2: par défaut les requetes en mode DELETE ou PUT retourneront "204/NoContent" quand tout se passe bien
     via l'option facultative ?v=true (au sens verbose=true) la réponse sera 200/OK accompagné
     d'un message json

NB3: les URLs sont exceptionnellement ici en deux versions (avec ou sans /tp/ pour que ça puisse fonctionner
avec ou sans reverse-proxy dans un cadre très particulier de tp )	 
*/


//*******************************************

//exemple URL: http://localhost:8233/devise-api/v1/private/reinit
apiRouter.route(['/devise-api/v1/private/reinit' , '/devise-api/v1/public/reinit' ,
                '/devise-api/private/reinit' , '/devise-api/public/reinit' ])
.get( async function(req , res  , next ) {
	try{
		let doneActionMessage = await deviseDao.reinit_db();
		res.send(doneActionMessage);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});


//exemple URL: http://localhost:8233/devise-api/v1/public/devises/EUR
apiRouter.route(['/devise-api/v1/public/devises/:id' ,
                 '/devise-api/public/devise/:id' ])
.get( async function(req , res  , next ) {
	var entityId = req.params.id;
	try{
		let devise = await deviseDao.findById( entityId);
		res.send(devise);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

//exemple URL: http://localhost:8233/devise-api/v1/public/devises (returning all devises)
//             http://localhost:8233/devise-api/v1/public/devises?changeMini=1.05
apiRouter.route([ '/devise-api/v1/public/devises', '/devise-api/public/devise'  ])
.get( async function(req , res  , next ) {
	var changeMini = Number(req.query.changeMini);
	var criteria=changeMini?{ change: { $gte: changeMini } }:{};
	try{
		let devises = await deviseDao.findByCriteria(criteria);
		res.send(devises);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

//exemple URL: http://localhost:8233/devise-api/v1/public/convert?amount=50&source=EUR&target=USD
apiRouter.route([ '/devise-api/v1/public/convert' ,'/devise-api/public/convert'  ])
.get( async  function(req , res  , next ) {
	let montant = Number(req.query.amount);
	let codeDeviseSource = req.query.source;
	let codeDeviseCible = req.query.target;
	try{
		let  [ deviseSource , deviseCible ]
		 = await  Promise.all([ deviseDao.findById(codeDeviseSource) ,
			                    deviseDao.findById(codeDeviseCible)
							   ]);
		let montantConverti = montant * deviseCible.change / deviseSource.change;
		res.send ( { amount : montant , 
					source :codeDeviseSource , 
					target : codeDeviseCible ,
					result : montantConverti});
		}
	catch(ex){
		res.status(statusCodeFromEx(ex)).send(ex);
	}
});


// http://localhost:8233/devise-api/v1/private/devises en mode post
// avec { "code" : "mxy" , "name" : "monnaieXy" , "change" : 123 } dans req.body
apiRouter.route([ '/devise-api/v1/private/devises', '/devise-api/v1/public/devises',
				  '/devise-api/private/devise', '/devise-api/public/devise' ])
.post(async function(req , res  , next ) {
	let newEntity = req.body;
	console.log("POST,newEntity="+JSON.stringify(newEntity));
	if(nullOrEmptyObject(newEntity)) { res.status(400).send(); return; } //BAD REQUEST
	try{
		let savedEntity = await deviseDao.save(newEntity);
		let id = newEntity.code ; //saved id (sometimes auto_incr id)
		//NB: res.location('/devise/' + id) because some clients may send two calls:
		//1. a post call to create new resource on server
		//   the server respond 201 with Location: /devise/mxy in http response header
		//2. the client may send a get request with /devise/mxy at url end to retreive full entity value
		res.location('/devise/' + id).status(201).send(savedEntity);//201: successfully created
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});



//   http://localhost:8233/devise-api/v1/public/devises/EUR en mode PUT
//ou http://localhost:8233/devise-api/v1/private/devises/EUR en mode PUT
// avec { "code" : "USD" , "name" : "Dollar" , "change" : 1.123 } dans req.body
// ou bien {  "name" : "Dollar" , "change" : 1.123 } dans req.body
apiRouter.route([ '/devise-api/v1/public/devises/:id' , '/devise-api/v1/private/devises/:id' ,
				  '/devise-api/private/devise',  '/devise-api/private/devise/:id' ,
                  '/devise-api/public/devise', '/devise-api/public/devise/:id' ])
.put( async function(req , res  , next ) {
	let newValueOfEntityToUpdate = req.body;
	console.log("PUT,newValueOfEntityToUpdate="+JSON.stringify(newValueOfEntityToUpdate));
    if(nullOrEmptyObject(newValueOfEntityToUpdate)) { res.status(400).send(); return; } //BAD REQUEST 
	//l'id de l'entity à mettre à jour en mode put peut soit être précisée en fin d'URL (solution conseillée)
	//soit être précisée dans les données json de la partie body (exceptionnellement accepté)
	//et si l'information est renseignée des 2 façons elle ne doit pas être incohérente:
	let entityId = req.params.id; //may be found (as string) at end of URL
	if(newValueOfEntityToUpdate.code != null && entityId != null 
		&&  newValueOfEntityToUpdate.code != entityId ) { res.status(400).send(); return; } //BAD REQUEST (incoherent id)
	if(newValueOfEntityToUpdate.code == null && entityId != null) newValueOfEntityToUpdate.code = entityId;
	if(newValueOfEntityToUpdate.code != null && entityId == null ) entityId = newValueOfEntityToUpdate.code;

	let verbose = req.query.v=="true"; //verbose mode (default as false)
	
	try{
		let updatedEntity = await deviseDao.updateOne(newValueOfEntityToUpdate);
		if(verbose)
		  res.send(updatedEntity); //200:OK with updated entity as Json response body
		else
		  res.status(204).send();//NO_CONTENT
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});


// http://localhost:8233/devise-api/v1/private/devises/EUR en mode DELETE
// http://localhost:8233/devise-api/v1/private/devises/EUR?v=true en mode DELETE
apiRouter.route([ '/devise-api/v1/private/devises/:id', '/devise-api/v1/public/devises/:id' ,
				  '/devise-api/private/devise/:id',   '/devise-api/public/devise/:id' ])
.delete(   /*checkAuth.checkAuth ,*/async function(req , res  , next ) {
	let entityId = req.params.id;
	console.log("DELETE,entityId="+entityId);
	let verbose = req.query.v=="true"; //verbose mode (default as false)
	try{
		let deleteActionMessage = await deviseDao.deleteOne(entityId);
		if(verbose)
		  res.send(deleteActionMessage);
		else
		  res.status(204).send();//NO_CONTENT
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});


//*************************** appel du web service REST data.fixer.io
//*************************** pour actualiser les taux de change dans la base de données



async function  callFixerIoWebServiceWithAxios(){
	//URL du web service a appeler:
	let  wsUrl = "http://data.fixer.io/api/latest?access_key=26ca93ee7fc19cbe0a423aaa27cab235" 
	//ici avec api-key de didier

	//type de réponse attendue:
	/*
	{"success":true,"timestamp":1635959583,"base":"EUR","date":"2021-11-03",
	"rates":{"AED":4.254663,"AFN":105.467869,..., "EUR":1 , ...}}
	*/
  try{
		const response = await axios.get(wsUrl)
		console.log("fixer.io response: " + JSON.stringify(response.data));
		//if(response.status==200)
			return response.data;
		//else throw { error : "error - not success"};
	}
   catch(ex){ 
		throw { error : "error - " + err};
	}
}//end of callFixerIoWebServiceWithAxios()

//http://localhost:8233/devise-api/v1/private/refresh
apiRouter.route(['/devise-api/v1/public/refresh','/devise-api/v1/private/refresh',
                 '/devise-api/private/refresh' , '/devise-api/public/refresh'  ])
.get( async function(req , res  , next ) {
	try {
		let respData = await callFixerIoWebServiceWithAxios();
		if(respData && respData.success){
			//refresh database values:
			let newRates = respData.rates;
			console.log("newRates="+newRates);
			for(let deviseKey in newRates){
				let deviseRate = newRates[deviseKey];
				//console.log(deviseKey + "-" + deviseRate);
				let devise = { code : deviseKey , change : deviseRate};
				switch(deviseKey){
					case "USD" : devise.name = "Dollar"; break;
					case "JPY" : devise.name = "Yen"; break;
					case "GBP" : devise.name = "Livre"; break;
					default : devise = null;
				}
				if(devise!=null){
					let updatedDevise = await deviseDao.updateOne(devise);
					console.log("updated devise:"+ JSON.stringify(updatedDevise))
				}
			}//end of for()
		} //end of if(respData.success)
		res.status(200).send(respData); //return / forward fixer.io results/response to say ok
	} catch(ex){
		res.status(statusCodeFromEx(ex)).send(ex);
	}
});//end of refresh route

export  default { apiRouter };