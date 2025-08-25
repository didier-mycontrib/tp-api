fichiers xxxx-api.spec.js = points d'entrées pour le lancement des tets basés sur chaiHttp

au sein de package.json:
"scripts": {
    "devise_test": "mocha ./test/devise-api.spec.js --exit --reporter spec",
    "product_test": "mocha ./test/product-api.spec.js --exit --reporter spec",
    "all_tests": "mocha ./test/all-api.spec.js --exit --reporter spec",
    ...
  }

  et donc 
  npm run devise_test   --> lance les tests sur la partie "devise"
  npm run all_tests   --> lance les tests sur toutes les parties  ( "devise" et "product" et ...)

  =============
Attention : si parties "private" inacessibles sans auth oauth2/...
alors besoin de 
set/export WITHOUT_AUTH=yes
avant npm run xxx_test 
  =============

xxxx-api.spec.js  utilise xxxx-api.test.js
et xxxx-api.test.js s'appuie sur common-app-test.js, generic_chai-httpèmocha-test.js
                       et sur dataset/xxxs.json, new_xxx.json , update_xxx.json