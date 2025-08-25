import { app , server } from '../server.js';
import { initMongodbContainer , initMainDataSet , removeMainDataSet,
  classicHttpCrudTest } from './generic-chai-http-mocha-test.js';

import { chai , expect ,retreiveMyAppRequester } from './common-app-test.js'


//NB: in script (.sh, .bat , ...) : set/export WITHOUT_AUTH=yes // undefined by default
//WITHOUT THAT , security (auth check) will block private requests (post, ..)
export function productClassicTest(){

  let testContext = {
    chai : chai,
    expect : expect,
    app : app,
    httpRequesterFn : retreiveMyAppRequester ,
    mainDataSetFilePath : "test/dataset/products.json" ,
    entityToAddFilePath : "test/dataset/new_product.json" ,
    entityToUpdateFilePath : "test/dataset/update_product.json" ,
    mainPrivateURL:"/product-api/v1/private/products" ,
    mainPublicURL:"/product-api/v1/public/products" ,
    extractIdFn : (product) => product.id ,
    setIdFn: (product,id) => { product.id = id } ,
    testEssentialSameValues: (e1,e2) => {
        expect(e1.label).to.equal(e2.label);
        expect(e1.price).to.equal(e2.price);
    }
  }

  classicHttpCrudTest(testContext);

}
