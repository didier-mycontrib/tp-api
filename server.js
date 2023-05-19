import express from 'express';
var app = express();

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

//verif auth beared token in request for private api/path:

app.use(verifAuth.verifTokenInHeadersForPrivatePath); // with OAuth2 autorization server or Standalone jwt
app.use(verifAuth.checkScopeForPrivatePath); //with OAuth2 autorization server (no effect in standaloneMode)

//ROUTES ORDINAIRES (apres PRE traitements , avant POST traitements)

// delegate REST API routes to apiRouter(s) :
app.use(productApiRoutes.apiRouter);
app.use(deviseApiRoutes.apiRouter);
app.use(userApiRoutes.apiRouter);
app.use(loginApiRoutes.apiRouter);

// POST traitements generiques

app.all("/*", function( req , res  , next ){
  res.status(400).send(); //BAD_REQUEST if no route match
})


let backendPort = process.env.PORT || 8233; 
app.listen(backendPort , function () {
  console.log("http://localhost:"+backendPort);
});