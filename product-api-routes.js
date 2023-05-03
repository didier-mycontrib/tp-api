import express from 'express';
const apiRouter = express.Router();

import productDao from './product-dao-mongoose.js';
var PersistentproductModel = productDao.ThisPersistentModel; //to use only for specific extra request (not in dao)


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
http://localhost:8233/product-api/private/xyz en accès private (avec auth nécessaire)
http://localhost:8233/product-api/public/xyz en accès public (sans auth nécessaire)

NB: dans vrai projet d'entreprise , public pour get pas confidentiel et private pour tout le reste
    ICI Exceptionnellement EN TP , presques toutes les URLS sont doublées : appelables en public et private
*/


//*******************************************

//exemple URL: http://localhost:8233/product-api/public/reinit
apiRouter.route(['/product-api/private/reinit' ,'/product-api/public/reinit' ])
.get( async function(req , res  , next ) {
	try{
		let doneActionMessage = await productDao.reinit_db();
		res.send(doneActionMessage);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});


//exemple URL: http://localhost:8233/product-api/public/product/618d53514e0720e69e2e54c8
apiRouter.route('/product-api/public/product/:id')
.get( async function(req , res  , next ) {
	var idproduct = req.params.id;
	try{
		let product = await productDao.findById( idproduct);
		res.send(product);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});

// exemple URL: http://localhost:8233/product-api/public/product
// returning all products if no ?prixMini
// http://localhost:8233/product-api/public/product?prixMini=1.05
apiRouter.route('/product-api/public/product')
.get( async function(req , res  , next ) {
	var prixMini = req.query.prixMini;
	//var criteria=title?{ title: title }:{};
	var criteria=prixMini?{ price: { $gte : prixMini } }:{};
	try{
		let products = await productDao.findByCriteria(criteria);
		res.send(products);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    } 
});


// http://localhost:8233/product-api/private/product en mode post
// avec { "id" : null , "label" : "productXy" , "price" : 12.3 }
//ou bien { "label" : "productXy" , "price" : 12.3 } dans req.body
apiRouter.route([ '/product-api/private/product',
                  '/product-api/public/product'])
.post(async function(req , res  , next ) {
	var nouveauproduct = req.body;
	console.log("POST,nouveauproduct="+JSON.stringify(nouveauproduct));
	try{
		let savedproduct = await productDao.save(nouveauproduct);
		res.send(savedproduct);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});



// http://localhost:8233/product-api/private/product en mode PUT
// avec { "id" : "618d53514e0720e69e2e54c8" , "label" : "product_xy" , "price" : 16.3 } dans req.body
apiRouter.route([ '/product-api/private/product',
                  '/product-api/public/product'])
.put( async function(req , res  , next ) {
	var newValueOfproductToUpdate = req.body;
	console.log("PUT,newValueOfproductToUpdate="+JSON.stringify(newValueOfproductToUpdate));
	try{
		let updatedproduct = await productDao.updateOne(newValueOfproductToUpdate);
		res.send(updatedproduct);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});


// http://localhost:8233/product-api/private/product/618d53514e0720e69e2e54c8 en mode DELETE
apiRouter.route([ '/product-api/private/product/:id',
                  '/product-api/public/product/:id'])
.delete( async function(req , res  , next ) {
	var idproduct = req.params.id;
	console.log("DELETE,idproduct="+idproduct);
	try{
		let deleteActionMessage = await productDao.deleteOne(idproduct);
		res.send(deleteActionMessage);
    } catch(ex){
	    res.status(statusCodeFromEx(ex)).send(ex);
    }
});

export  default { apiRouter };