import express from 'express';
const apiRouter = express.Router();

import productDao from './product-dao-mongoose.js';
// productDao.ThisPersistentModelFn(); //to use only for specific extra request (not in dao)

import { statusCodeFromEx , nullOrEmptyObject , build_api_uris , 
	    addDefaultPrivateReInitRoute , addRedirectPublicToPrivateRoute,
	    addDefaultGetByIdRoute ,addDefaultGetByCriteriaRoute ,
	    addDefaultDeleteRoute , addDefaultPostRoute , addDefaultPutRoute} from "./generic-express-util.js";

const api_name="tp/product-api"
const api_version="v1"
const main_entities_name="products" // main collection (entities name)  

const api_uris = build_api_uris(api_name,api_version,main_entities_name);




/*
	 
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



//exemple URL: http://localhost:8233/tp/product-api/v1/public/
addDefaultPrivateReInitRoute(apiRouter,productDao,api_uris)


//exemple URL: http://localhost:8233/tp/product-api/v1/public/product/618d53514e0720e69e2e54c8
/**
 * @openapi
 * /tp/product-api/v1/public/products/{id}:
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


// exemple URL: http://localhost:8233/tp/product-api/v1/public/products
// returning all products if no ?minPrice
// http://localhost:8233/tp/product-api/v1/public/products?minPrice=1.
/**
 * @openapi
 * /tp/product-api/v1/public/products:
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



// http://localhost:8233/tp/product-api/v1/private/products en mode post
// avec { "code" : "mxy" , "name" : "monnaieXy" , "change" : 123 } dans req.body
/**
 * @openapi
 * /tp/product-api/v1/private/products:
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



/**
 * @openapi
 * /tp/product-api/v1/private/products/{id}:
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
	 (idRes,productToUpdate) => { productToUpdate.id = idRes; }
)


// http://localhost:8233/tp/product-api/v1/private/products/EUR en mode DELETE
// http://localhost:8233/tp/product-api/v1/private/products/EUR?v=true en mode DELETE
/**
 * @openapi
 * /tp/product-api/v1/private/products/{id}:
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