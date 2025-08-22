import express from 'express';
const apiRouter = express.Router();

import productDao from './product-dao-mongoose.js';
// productDao.ThisPersistentModelFn(); //to use only for specific extra request (not in dao)

import { statusCodeFromEx , nullOrEmptyObject , build_api_uris , 
	    addDefaultPrivateReInitRoute ,
	    addDefaultGetByIdRoute ,addDefaultGetByCriteriaRoute ,
	    addDefaultDeleteRoute , addDefaultPostRoute , addDefaultPutRoute} from "./generic-express-util.js";

const api_name="product-api"
const api_version="v1"
const main_entities_name="products" // main collection (entities name)  

const api_uris = build_api_uris(api_name,api_version,main_entities_name);




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
*/


//*******************************************

apiRouter.route(['/product-api/public/reinit' , //old bad public url (before v1)
	'/product-api/private/reinit',//old bad private url (before v1)
	'/product-api/v1/public/reinit' , //unsecure public url (for simple call :  TP)
]).get( function(req,res){
   res.redirect(`/product-api/v1/private/reinit`); //new good restfull url (v1)
});

//exemple URL: http://localhost:8233/product-api/v1/public/
addDefaultPrivateReInitRoute(apiRouter,productDao,api_uris)


apiRouter.route(['/product-api/public/product/:id' ]) //old bad url (before v1)
.get( function(req,res){
   res.redirect(`/product-api/v1/public/products/${req.params.id}`); //new good restfull url (v1)
});

//exemple URL: http://localhost:8233/product-api/v1/public/product/618d53514e0720e69e2e54c8
/**
 * @openapi
 * /product-api/v1/public/products/{id}:
 *   get:
 *     description: product by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: 618d53514e0720e69e2e54c8
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Product"
 *         description: Returns Product
 *       404:
 *         description: NOT_FOUND
 */
addDefaultGetByIdRoute(apiRouter,productDao,api_uris,"public")


apiRouter.route(['/product-api/public/product' ]) //old bad url (before v1)
.get( function(req,res){
   res.redirect(`/product-api/v1/public/products`); //new good restfull url (v1)
});

// exemple URL: http://localhost:8233/product-api/v1/public/products
// returning all products if no ?minPrice
// http://localhost:8233/product-api/v1/public/products?minPrice=1.
/**
 * @openapi
 * /product-api/v1/public/products:
 *   get:
 *     description: get products from optional criteria (minPrice=)
 *     parameters:
 *       - name: minPrice
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
 *               $ref: "#/components/schemas/ProductArray"
 *         description: product list
 */
addDefaultGetByCriteriaRoute(apiRouter,productDao,api_uris,"public",
	(req)=>{const minPrice = req.query.minPrice;
            const criteria=minPrice?{ price: { $gte : minPrice } }:{};
			return criteria }
)



apiRouter.route(['/product-api/public/product' , //old bad public url (before v1)
	'/product-api/private/product',//old bad private url (before v1)
	'/product-api/v1/public/products' , //unsecure public url (for simple call :  TP)
]) 
.post( function(req,res){
   res.redirect(`/product-api/v1/private/products`); //new good restfull url (v1)
});

// http://localhost:8233/product-api/v1/private/products en mode post
// avec { "code" : "mxy" , "name" : "monnaieXy" , "change" : 123 } dans req.body
/**
 * @openapi
 * /product-api/v1/private/products:
 *   post:
 *     description: post a new product
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Product"
 *     responses:
 *       201:
 *         description: saved product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Product"
 *       500:
 *         description: INTERNAL_SERVER_ERROR
 */
addDefaultPostRoute(apiRouter,productDao,api_uris,
     (savedproduct)=>savedproduct.id 
)

//Redirection For bad old version (before v1)
apiRouter.route(['/product-api/public/product/:id' , //old bad public url (before v1)
	'/product-api/private/product/:id',//old bad private url (before v1)
	'/product-api/public/product' , //old very bad public url (before v1)
	'/product-api/private/product',//old very bad private url (before v1)
	'/product-api/v1/public/products/:id' , //unsecure public url (for simple call :  TP)
]) 
.put( function(req,res){
   let idRes = req.params.id;
   let newValueOfEntityToUpdate = req.body;
   if(idRes == undefined)
	  idRes=newValueOfEntityToUpdate.code
   res.redirect(`/product-api/v1/private/products/${idRes}`); //new good restfull url (v1)
});


//   http://localhost:8233/product-api/v1/public/products/EUR en mode PUT
//ou http://localhost:8233/product-api/v1/private/products/EUR en mode PUT
// avec { "code" : "USD" , "name" : "Dollar" , "change" : 1.123 } dans req.body
// ou bien {  "name" : "Dollar" , "change" : 1.123 } dans req.body
/**
 * @openapi
 * /product-api/v1/private/products/{id}:
 *   put:
 *     description: update product with existing id
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
 *         description: "verbose: to ask 200/updatedproduct (not 204/NO_CONTENT)"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Product"
 *     responses:
 *       200:
 *         description: updated Product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Product"
 *       204:
 *         description: NO_CONTENT (OK)
 *       404:
 *         description: NOT_FOUND
 */
addDefaultPutRoute(apiRouter,productDao,api_uris,
	 (idRes,productToUpdate) => { productToUpdate.code = idRes; }
)


apiRouter.route(['/product-api/public/product/:id' , //old bad public url (before v1)
	'/product-api/private/product/:id',//old bad private url (before v1)
	'/product-api/v1/public/products/:id' , //unsecure public url (for simple call :  TP)
]) 
.delete( function(req,res){
   res.redirect(`/product-api/v1/private/products/${req.params.id}`); //new good restfull url (v1)
});


// http://localhost:8233/product-api/v1/private/products/EUR en mode DELETE
// http://localhost:8233/product-api/v1/private/products/EUR?v=true en mode DELETE
/**
 * @openapi
 * /product-api/v1/private/products/{id}:
 *   delete:
 *     description: delete product from id
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
 *         description: "verbose: to ask 200/message (not 204/NO_CONTENT)"
 *     responses:
 *       200:
 *         description : delete action json message with deletedId
 *       204:
 *         description: NO_CONTENT (OK)
 *       404:
 *         description: NOT_FOUND
 */
addDefaultDeleteRoute(apiRouter,productDao,api_uris)


export  default { apiRouter };