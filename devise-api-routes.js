import express from 'express';
const apiRouter = express.Router();

import deviseDao from './devise-dao-mongoose.js';
var PersistentDeviseModel = deviseDao.ThisPersistentModel; //to use only for specific extra request (not in dao)

//NB: les api axios ou fetch servent à appeler des WS REST avec des Promises
//const axios = require('axios'); 
import axios from 'axios';// npm install -s axios

function statusCodeFromEx(ex){
	let status = 500;
	let error = ex?ex.error:null ; 
	switch(error){
		case "BAD_REQUEST" : status = 400; break;
		case "NOT_FOUND" : status = 404; break;
		//...
		case "CONFLICT" : status = 409; break;
		default: status = 500;
	}
	return status;
}

/*
Nouvelle convention d'URL :
http://localhost:8233/devise-api/private/xyz en accès private (avec auth nécessaire)
http://localhost:8233/devise-api/public/xyz en accès public (sans auth nécessaire)
NB: dans vrai projet d'entreprise , public pour get pas confidentiel et private pour tout le reste
    ICI Exceptionnellement EN TP , presques toutes les URLS sont doublées : appelables en public et private
*/


//*******************************************

//exemple URL: http://localhost:8233/devise-api/private/reinit
apiRouter.route(['/devise-api/private/reinit' , '/devise-api/public/reinit' ])
.get( async function(req , res  , next ) {
	try{
		let doneActionMessage = await deviseDao.reinit_db();
		res.send(doneActionMessage);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});


//exemple URL: http://localhost:8233/devise-api/public/devise/EUR
apiRouter.route('/devise-api/public/devise/:code')
.get( async function(req , res  , next ) {
	var codeDevise = req.params.code;
	try{
		let devise = await deviseDao.findById( codeDevise);
		res.send(devise);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

//exemple URL: http://localhost:8233/devise-api/public/devise (returning all devises)
//             http://localhost:8233/devise-api/public/devise?changeMini=1.05
apiRouter.route('/devise-api/public/devise')
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

//exemple URL: http://localhost:8233/devise-api/public/convert?amount=50&source=EUR&target=USD
apiRouter.route('/devise-api/public/convert')
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


// http://localhost:8233/devise-api/private/devise en mode post
// avec { "code" : "mxy" , "name" : "monnaieXy" , "change" : 123 } dans req.body
apiRouter.route([ '/devise-api/private/devise',
                  '/devise-api/public/devise'])
.post(async function(req , res  , next ) {
	var nouvelleDevise = req.body;
	console.log("POST,nouvelleDevise="+JSON.stringify(nouvelleDevise));
	try{
		let savedDevise = await deviseDao.save(nouvelleDevise);
		res.send(savedDevise);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});



// http://localhost:8233/devise-api/private/devise en mode PUT
// avec { "code" : "USD" , "name" : "Dollar" , "change" : 1.123 } dans req.body
apiRouter.route([ '/devise-api/private/devise',
                  '/devise-api/public/devise'])
.put( async function(req , res  , next ) {
	var newValueOfdeviseToUpdate = req.body;
	console.log("PUT,newValueOfdeviseToUpdate="+JSON.stringify(newValueOfdeviseToUpdate));
	try{
		let updatedDevise = await deviseDao.updateOne(newValueOfdeviseToUpdate);
		res.send(updatedDevise);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});


// http://localhost:8233/devise-api/private/devise/EUR en mode DELETE
apiRouter.route([ '/devise-api/private/devise/:code',
                  '/devise-api/public/devise/:code'])
.delete(   /*checkAuth.checkAuth ,*/async function(req , res  , next ) {
	var codeDevise = req.params.code;
	console.log("DELETE,codeDevise="+codeDevise);
	try{
		let deleteActionMessage = await deviseDao.deleteOne(codeDevise);
		res.send(deleteActionMessage);
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

//http://localhost:8233/devise-api/private/refresh
apiRouter.route(['/devise-api/private/refresh' , '/devise-api/public/refresh' ])
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