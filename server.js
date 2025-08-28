import express from 'express';
export const  app = express();
import swaggerUi from 'swagger-ui-express';
import swaggerJsdocPkg from 'swagger-jsdoc';
const  swaggerJSDoc  = swaggerJsdocPkg;

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

import productApiRoutes from './product-api-routes.js';
import deviseApiRoutes from './devise-api-routes.js';
import userApiRoutes from './standalone-user-api-routes.js';
import loginApiRoutes from './standalone-login-api-routes.js';

import verifAuth from './verif-auth.js'; //for  oauth2/iodc/keycloak  

//support parsing of JSON post data
var jsonParser = express.json({  extended: true}); 
app.use(jsonParser);

// CORS enabled with express/node-js :
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, PATCH, DELETE"); //default: GET, ...
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
   if(req.method === 'OPTIONS'){
        res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE'); //to give access to all the methods provided
        return res.status(200).json({});
    }
  next();
});


//les routes en /html/... seront gérées par express par
//de simples renvois des fichiers statiques
//du répertoire "./html"
app.use('/html', express.static(__dirname+"/html"));
app.get('/', function(req , res ) {
  res.redirect('/html/index.html');
});

app.use('/tp-app', express.static(__dirname+"/tp-app"));

let withoutAuth = process.env.WITHOUT_AUTH ;

if(withoutAuth!="yes"){
	//verif auth beared token in request for private api/path:

	app.use(verifAuth.verifTokenInHeadersForPrivatePath); // with OAuth2 autorization server or Standalone jwt
	app.use(verifAuth.checkScopeForPrivatePath); //with OAuth2 autorization server (no effect in standaloneMode)
}

const options_devise_api = {
  definition: {  openapi: '3.0.0',  info: {  title: 'tp/devise-api',  version: 'v1'  }  },
  apis: ['devise-api-routes.js' ,'devise-dao-mongoose.js' ], // files containing annotations with @openapi
};
const deviseSwaggerSpec = swaggerJSDoc(options_devise_api);
app.use('/tp/devise-api/v1/api-docs', swaggerUi.serve, (...args) => swaggerUi.setup(deviseSwaggerSpec)(...args));
 
const options_product_api = {
  definition: {  openapi: '3.0.0',  info: {  title: 'tp/product-api',  version: 'v1'  }  },
  apis: ['product-api-routes.js' ,'product-dao-mongoose.js' ], // files containing annotations with @openapi
};
const productSwaggerSpec = swaggerJSDoc(options_product_api);
app.use('/tp/product-api/v1/api-docs', swaggerUi.serve, (...args) => swaggerUi.setup(productSwaggerSpec)(...args));

const options_standalone_user_api = {
  definition: {  openapi: '3.0.0',  info: {  title: 'tp/standalone-user-api',  version: 'v1'  }  },
  apis: ['standalone-user-api-routes.js' ,'standalone-user-dao-mongoose.js' ], // files containing annotations with @openapi
};
const standaloneUserSwaggerSpec = swaggerJSDoc(options_standalone_user_api);
app.use('/tp/standalone-user-api/v1/api-docs', swaggerUi.serve, (...args) => swaggerUi.setup(standaloneUserSwaggerSpec)(...args));



//ROUTES ORDINAIRES (apres PRE traitements , avant POST traitements)

// delegate REST API routes to apiRouter(s) :
app.use(productApiRoutes.apiRouter);
app.use(deviseApiRoutes.apiRouter);
app.use(userApiRoutes.apiRouter);
app.use(loginApiRoutes.apiRouter);

// POST traitements generiques

app.all("/{*splat}", function( req , res  , next ){
  res.status(400).send(); //BAD_REQUEST if no route match
})


let backendPort = process.env.PORT || 8233; 
export const server = app.listen(backendPort , function () {
  console.log("http://localhost:"+backendPort);
});