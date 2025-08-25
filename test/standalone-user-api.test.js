import { app , server } from '../server.js';
import { initMongodbContainer , initMainDataSet , removeMainDataSet,
  classicHttpCrudTest } from './generic-chai-http-mocha-test.js';

import { chai , expect ,retreiveMyAppRequester } from './common-app-test.js'


//NB: in script (.sh, .bat , ...) : set/export WITHOUT_AUTH=yes // undefined by default
//WITHOUT THAT , security (auth check) will block private requests (post, ..)
export function standaloneUserClassicTest(){

  let testContext = {
  chai : chai,
  expect : expect,
  app : app,
  httpRequesterFn : retreiveMyAppRequester ,
  mainDataSetFilePath : "test/dataset/users.json" ,
  entityToAddFilePath : "test/dataset/new_user.json" ,
  entityToUpdateFilePath : "test/dataset/update_user.json" ,
  mainPrivateURL:"/standalone-user-api/v1/private/users" ,
  mainPublicURL:"/standalone-user-api/v1/public/users" ,
  extractIdFn : (user) => user.id ,
  setIdFn: (user,id) => { user.id = id } ,
  testEssentialSameValues: (e1,e2) => {
      expect(e1.firstName).to.equal(e2.firstName);
      expect(e1.lastName).to.equal(e2.lastName);
      expect(e1.email).to.equal(e2.email);
      expect(e1.newPassword).to.equal(e2.newPassword);
      expect(e1.mainGroup).to.equal(e2.mainGroup);
   }
}

  classicHttpCrudTest(testContext);

}
