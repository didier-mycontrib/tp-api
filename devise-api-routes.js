import express from 'express';
const apiRouter = express.Router();
import deviseDao from './devise-dao-mongoose.js';
import { statusCodeFromEx , nullOrEmptyObject , build_api_uris , 
	    addDefaultPrivateReInitRoute ,
	    addDefaultGetByIdRoute ,addDefaultGetByCriteriaRoute ,
	    addDefaultDeleteRoute , addDefaultPostRoute , addDefaultPutRoute} from "./generic-express-util.js";

const api_name="devise-api"
const api_version="v1"
const main_entities_name="devises" // main collection (entities name)  

const api_uris = build_api_uris(api_name,api_version,main_entities_name);

//deviseDao.ThisPersistentModelFn() //to use only for specific extra request (not in dao)

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
	 
*/


//*******************************************

apiRouter.route(['/devise-api/public/reinit' , //old bad public url (before v1)
	'/devise-api/private/reinit',//old bad private url (before v1)
	'/devise-api/v1/public/reinit' , //unsecure public url (for simple call :  TP)
]) 
.get( function(req,res){
   res.redirect(`/devise-api/v1/private/reinit`); //new good restfull url (v1)
});

//exemple URL: http://localhost:8233/devise-api/v1/private/reinit
addDefaultPrivateReInitRoute(apiRouter,deviseDao,api_uris)



apiRouter.route(['/devise-api/public/devise/:id' ]) //old bad url (before v1)
.get( function(req,res){
   res.redirect(`/devise-api/v1/public/devises/${req.params.id}`); //new good restfull url (v1)
});

//exemple URL: http://localhost:8233/devise-api/v1/public/devises/EUR
/**
 * @openapi
 * /devise-api/v1/public/devises/{id}:
 *   get:
 *     description: devise by id/code
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: EUR
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Devise"
 *         description: Returns Devise
 *       404:
 *         description: NOT_FOUND
 */
addDefaultGetByIdRoute(apiRouter,deviseDao,api_uris,"public")

apiRouter.route(['/devise-api/public/devise' ]) //old bad url (before v1)
.get( function(req,res){
   res.redirect(`/devise-api/v1/public/devises`); //new good restfull url (v1)
});

//exemple URL: http://localhost:8233/devise-api/v1/public/devises (returning all devises)
//             http://localhost:8233/devise-api/v1/public/devises?changeMini=1.05
/**
 * @openapi
 * /devise-api/v1/public/devises:
 *   get:
 *     description: get devises from optional criteria (changeMini=)
 *     parameters:
 *       - name: changeMini
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *           format: double
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/DeviseArray"
 *         description: devise list
 */
addDefaultGetByCriteriaRoute(apiRouter,deviseDao,api_uris,"public",
	(req)=>{const changeMini = Number(req.query.changeMini); 
		    const  criteria=changeMini?{ change: { $gte: changeMini } }:{}; 
			return criteria }
)

/**
 * @openapi
 * components:
 *   schemas:
 *     ConvertResponse:
 *       type: object
 *       properties:
 *         amount:
 *           type: number
 *           format: double
 *           example : 100
 *         source:
 *           type: string
 *           example : EUR
 *         target:
 *           type: string
 *           example : USD
 *         result:
 *           type: number
 *           format: double
 *           example : 112
 */

//exemple URL: http://localhost:8233/devise-api/v1/public/convert?amount=50&source=EUR&target=
/**
 * @openapi
 * /devise-api/v1/public/convert:
 *   get:
 *     description: return converted change
 *     parameters:
 *       - name: amount
 *         in: query
 *         required: true
 *         example : 100
 *         schema:
 *           type: number
 *           format: double
 *       - name: source
 *         in: query
 *         required: true
 *         example : EUR
 *         schema:
 *           type: string
 *           description: "code of source devise"
 *       - name: target
 *         in: query
 *         required: true
 *         example : USD
 *         schema:
 *           type: string
 *           description: "code of target devise"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ConvertResponse"
 *         description: converted change
 */
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

apiRouter.route(['/devise-api/public/devise' , //old bad public url (before v1)
	'/devise-api/private/devise',//old bad private url (before v1)
	'/devise-api/v1/public/devises' , //unsecure public url (for simple call :  TP)
]) 
.post( function(req,res){
   res.redirect(`/devise-api/v1/private/devises`); //new good restfull url (v1)
});

// http://localhost:8233/devise-api/v1/private/devises en mode post
// avec { "code" : "mxy" , "name" : "monnaieXy" , "change" : 123 } dans req.body
/**
 * @openapi
 * /devise-api/v1/private/devises:
 *   post:
 *     description: post a new devise
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Devise"
 *     responses:
 *       201:
 *         description: saved devise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Devise"
 *       500:
 *         description: INTERNAL_SERVER_ERROR
 */
addDefaultPostRoute(apiRouter,deviseDao,api_uris,
     (savedDevise)=>savedDevise.code 
)

//Redirection For bad old version (before v1)
apiRouter.route(['/devise-api/public/devise/:id' , //old bad public url (before v1)
	'/devise-api/private/devise/:id',//old bad private url (before v1)
	'/devise-api/public/devise' , //old very bad public url (before v1)
	'/devise-api/private/devise',//old very bad private url (before v1)
	'/devise-api/v1/public/devises/:id' , //unsecure public url (for simple call :  TP)
]) 
.put( function(req,res){
   let idRes = req.params.id;
   let newValueOfEntityToUpdate = req.body;
   if(idRes == undefined)
	  idRes=newValueOfEntityToUpdate.code
   res.redirect(`/devise-api/v1/private/devises/${idRes}`); //new good restfull url (v1)
});


//   http://localhost:8233/devise-api/v1/public/devises/EUR en mode PUT
//ou http://localhost:8233/devise-api/v1/private/devises/EUR en mode PUT
// avec { "code" : "USD" , "name" : "Dollar" , "change" : 1.123 } dans req.body
// ou bien {  "name" : "Dollar" , "change" : 1.123 } dans req.body
/**
 * @openapi
 * /devise-api/v1/private/devises/{id}:
 *   put:
 *     description: update devise with existing id/code
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: JPY
 *       - name: v
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: "verbose: to ask 200/updatedDevise (not 204/NO_CONTENT)"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Devise"
 *     responses:
 *       200:
 *         description: updated devise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Devise"
 *       204:
 *         description: NO_CONTENT (OK)
 *       404:
 *         description: NOT_FOUND
 */
addDefaultPutRoute(apiRouter,deviseDao,api_uris,
	 (idRes,deviseToUpdate) => { deviseToUpdate.code = idRes; }
)


apiRouter.route(['/devise-api/public/devise/:id' , //old bad public url (before v1)
	'/devise-api/private/devise/:id',//old bad private url (before v1)
	'/devise-api/v1/public/devises/:id' , //unsecure public url (for simple call :  TP)
]) 
.delete( function(req,res){
   res.redirect(`/devise-api/v1/private/devises/${req.params.id}`); //new good restfull url (v1)
});


// http://localhost:8233/devise-api/v1/private/devises/EUR en mode DELETE
// http://localhost:8233/devise-api/v1/private/devises/EUR?v=true en mode DELETE
/**
 * @openapi
 * /devise-api/v1/private/devises/{id}:
 *   delete:
 *     description: delete devise from code/id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: DKK
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
addDefaultDeleteRoute(apiRouter,deviseDao,api_uris)


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