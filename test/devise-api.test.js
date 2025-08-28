import { app , server } from '../server.js';
import { initMongodbContainer , initMainDataSet , removeMainDataSet,
   classicHttpCrudInnerTestObject , firstLevelTestWithTestContainer } from './generic-chai-http-mocha-test.js';

import { chai , expect ,retreiveMyAppRequester } from './common-app-test.js'


//NB: in script (.sh, .bat , ...) : set/export WITHOUT_AUTH=yes // undefined by default
//WITHOUT THAT , security (auth check) will block private requests (post, ..)

export function deviseClassicSubTestGroup(){

  let testContext = {
    chai : chai,
    expect : expect,
    app : app,
    name : "devise-api-test",
    httpRequesterFn : retreiveMyAppRequester ,
    mainDataSetFilePath : "test/dataset/devises.json" ,
    entityToAddFilePath : "test/dataset/new_devise.json" ,
    entityToUpdateFilePath : "test/dataset/update_devise.json" ,
    mainPrivateURL:"/tp/devise-api/v1/private/devises" ,
    mainPublicURL:"/tp/devise-api/v1/public/devises" ,
    extractIdFn : (devise) => devise.code ,
    setIdFn: (devise,id) => { devise.code = id } ,
    testEssentialSameValues: (e1,e2) => {
        expect(e1.name).to.equal(e2.name);
        expect(e1.change).to.equal(e2.change);
    }
  }


  const mySpecificSubGroupTests =
  ()=>{
    //with inner it(...)
  }
    /*
    this tests block will be inserted in a sub described part of classicHttpCrudTest
    all inner tests should be written as following :
      * get http requester via requester = testContext.httpRequesterFn();
        with or without .keepOpen() and .close()
      * testContext.expect(res)....
      * can access testContext.mainEntities initialized by classicHttpCrudTest main describe block 
    */



  return  classicHttpCrudInnerTestObject(testContext); 
         //classicHttpCrudInnerTestObject(testContext,mySpecificSubGroupTests);
  

}
