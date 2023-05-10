npm install -s express
npm install -s mongoose
npm install -s axios
=======================
npm install -s passport passport-keycloak-bearer pour version dépendante de OAuth2/keycloak
npm install -s passport
===========
npm install -s jsonwebtoken
===========
OU BIEN "npm install" après récupération du code source via git clone ou autre
============
NB: ce projet nécessite absolument une connexion à une base mongoDB
(voir fichier db-mongoose.js)

===========================
Comportement de ce backend pour Tp :
-----------
Après un premier démarrage , 
http://localhost:8233

naviguer vers http://localhost:8233/html/public_index.html
et déclencher 
réinitialiser devises (http://localhost:8233/devise-api/public/reinit)
réinitialiser produits (http://localhost:8233/product-api/public/reinit)
réinitialiser standalone users (http://localhost:8233/standalone-user-api/public/reinit)
pour initialiser un jeux de données dans la base de données mongodb. 

=============
toutes les URL ayant une partie /public/ sont directement accessibles sans authentification
toutes les URL ayant une partie /private/ ne sont accessibles qu'après une authentification
============
Cette authentification pourra être effectuée de 2 manières:
- soit via le serveur outh2/oidc keycloak https://www.d-defrance.fr/keycloak/realms/sandboxrealm/.well-known/openid-configuration
  si celui-ci est accessible , on utilisera le realm "sandboxrealm" 
- soit en mode standalone par ce backend lui-même via le web service http://localhost:8233/standalone-login-api/public/auth
  a déclencher en mode POST avec { "username" : "mgr1" , "password" : "pwd1" } qui sera vérifié via collections "users" dans base mongoDB

=============
NB: une version de ce serveur est normalement accessible en ligne via l'URL suivante:
https://www.d-defrance.fr/tp/tp-api-html/index.html

============
NB: ce serveur est compatible avec l'application angular "tp-app"
(code source : https://github.com/didier-mycontrib/tp-app)
et avec une version normalement accessible en ligne : https://www.d-defrance.fr/tp-app