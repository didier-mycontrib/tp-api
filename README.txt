npm install -s express
npm install -s mongoose
npm install -s axios
=======================
cette application a été adaptée/enrichie le 9/6/2022 de manière à offrir les memes fonctionnalités de backend-tp-api
et peut ainsi être utilisée en arrière plan du tp angular
===========
npm install -s jsonwebtoken pour la version standalone
----------
npm install -s passport passport-keycloak-bearer pour version dépendante de OAuth2/keycloak
npm install -s qs passport-jwt + axios/fetch token introspection (variante pour OAuth2/oidc)
===========
NB: ce projet nécessite absolument une connexion à une base mongoDB
(voir fichier db-mongoose.js)