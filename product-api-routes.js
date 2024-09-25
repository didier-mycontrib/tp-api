import express from 'express';
const apiRouter = express.Router();

import { statusCodeFromEx , nullOrEmptyObject } from "./generic-express-util.js";
import productDao from './product-dao-mongoose.js';
var PersistentproductModel = productDao.ThisPersistentModel; //to use only for specific extra request (not in dao)



/*
NB: la redirection https://www.d-defrance.fr/xyz-api
     vers  http://localhost:8233/xyz-api est effectuée dans nginx.conf
	 et donc pas besoin de /tp/... dans ce fichier
	 
Nouvelle convention d'URL :
http://localhost:8233/product-api/v1/private/xyz en accès private (avec auth nécessaire)
http://localhost:8233/product-api/v1/public/xyz en accès public (sans auth nécessaire)

NB: dans vrai projet d'entreprise , public pour get pas confidentiel et private pour tout le reste
    ICI Exceptionnellement EN TP , presques toutes les URLS sont doublées : appelables en public et private

NB2: par défaut les requetes en mode DELETE ou PUT retourneront "204/NoContent" quand tout se passe bien
     via l'option facultative ?v=true (au sens verbose=true) la réponse sera 200/OK accompagné
     d'un message json

NB3: les URLs sont exceptionnellement ici en deux versions (avec ou sans /tp/ pour que ça puisse fonctionner
avec ou sans reverse-proxy dans un cadre très particulier de tp )		 
*/


//*******************************************

//exemple URL: http://localhost:8233/product-api/v1/public/reinit
apiRouter.route([ '/product-api/v1/private/reinit' ,'/product-api/v1/public/reinit',
				 '/product-api/private/reinit' ,'/product-api/public/reinit'  ])
.get( async function(req , res  , next ) {
	try{
		let doneActionMessage = await productDao.reinit_db();
		res.send(doneActionMessage);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});


//exemple URL: http://localhost:8233/product-api/v1/public/product/618d53514e0720e69e2e54c8
apiRouter.route(['/product-api/v1/public/products/:id' ,
				 '/product-api/public/product/:id'])
.get( async function(req , res  , next ) {
	var entityId = req.params.id;
	try{
		let product = await productDao.findById( entityId);
		res.send(product);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

// exemple URL: http://localhost:8233/product-api/v1/public/products
// returning all products if no ?minPrice
// http://localhost:8233/product-api/v1/public/products?minPrice=1.05
apiRouter.route(['/product-api/v1/public/products' , '/product-api/public/products',
				'/product-api/public/product' ])
.get( async function(req , res  , next ) {
	let minPrice = req.query.minPrice;
	//var criteria=title?{ title: title }:{};
	let criteria=minPrice?{ price: { $gte : minPrice } }:{};
	try{
		let products = await productDao.findByCriteria(criteria);
		res.send(products);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});


// http://localhost:8233/product-api/v1/private/products en mode post
// avec { "id" : null , "label" : "productXy" , "price" : 12.3 }
//ou bien { "label" : "productXy" , "price" : 12.3 } dans req.body
apiRouter.route([ '/product-api/v1/private/products', '/product-api/v1/public/products',
				  '/product-api/private/product' , '/product-api/public/product' ])
.post(async function(req , res  , next ) {
	let newEntity = req.body;
	console.log("POST,newEntity="+JSON.stringify(newEntity));
	if(nullOrEmptyObject(newEntity)) { res.status(400).send(); return; } //BAD REQUEST
	try{
		let savedEntity = await productDao.save(newEntity);
		let id = newEntity.id ; //saved id (sometimes auto_incr id)
		//NB: res.location('/devise/' + id) because some clients may send two calls:
		//1. a post call to create new resource on server
		//   the server respond 201 with Location: /devise/mxy in http response header
		//2. the client may send a get request with /devise/mxy at url end to retreive full entity value
		res.location('/product/' + id).status(201).send(savedEntity);//201: successfully created
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});



// http://localhost:8233/product-api/v1/private/products/618d53514e0720e69e2e54c8 en mode PUT
// avec { "id" : "618d53514e0720e69e2e54c8" , "label" : "product_xy" , "price" : 16.3 } dans req.body
apiRouter.route([ '/product-api/v1/public/products/:id','/product-api/v1/private/products/:id',
				 '/product-api/private/product','/product-api/private/product/:id' ,
                  '/product-api/public/product', '/product-api/public/product/:id'])
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

	let verbose = req.query.v=="true"; //verbose mode (default as false)
	try{
		let updatedEntity = await productDao.updateOne(newValueOfEntityToUpdate);
		if(verbose)
		  res.send(updatedEntity); //200:OK with updated entity as Json response body
		else
		  res.status(204).send();//NO_CONTENT
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});


// http://localhost:8233/product-api/v1/private/products/618d53514e0720e69e2e54c8 en mode DELETE
apiRouter.route([ '/product-api/v1/public/products/:id','/product-api/v1/private/products/:id',
				  '/product-api/private/product/:id' , '/product-api/public/product/:id' ])
.delete( async function(req , res  , next ) {
	let entityId = req.params.id;
	console.log("DELETE,entityId="+entityId);
	let verbose = req.query.v=="true"; //verbose mode (default as false)
	try{
		let deleteActionMessage = await productDao.deleteOne(entityId);
		if(verbose)
		  res.send(deleteActionMessage);
		else
		  res.status(204).send();//NO_CONTENT
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});

export  default { apiRouter };