une ancienne version de js/keycloak.js etait une copie de https://www.d-defrance.fr/keycloak/js/keycloak.js
documentation : https://wjw465150.gitbooks.io/keycloak-documentation/content/securing_apps/topics/oidc/javascript-adapter.html

Maintenant pour les versions récentes de keycloak , la source est 

https://cdn.jsdelivr.net/npm/keycloak-js@26.2.0/lib/keycloak.js

ou bien

npm install -s keycloak-js 

====
dans logInOut.html :

<script src="js/logInOut.js" type="module"></script> <!-- now with type="module" -->

et dans le haut de logInOut.js besoin de
import Keycloak from './keycloak.js';
