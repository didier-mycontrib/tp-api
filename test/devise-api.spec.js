import {use} from  'chai';
import chaiHttp  from 'chai-http';
import { app , server } from '../server.js';
import { initMongodbContainer , initMainDataSet , removeMainDataSet,
  classicHttpCrudTest } from './generic-chai-http-mocha-test.js';
import { test } from 'mocha';


//NB: in script (.sh, .bat , ...) : set/export WITHOUT_AUTH=yes // undefined by default
//WITHOUT THAT , security (auth check) will block private requests (post, ..)

const chai=use(chaiHttp); //configure chai to use chaiHttp
//NB: run mocha with --exit option for good server exit after test execution

const { expect } = chai;

function retreiveMyAppRequester(){
    return chai.request.execute(app);//"http://localhost:8230" or ...
    //NB: this code may change in other chai,chaiHttp versions
}

let testContext = {
  chai : chai,
  expect : expect,
  app : app,
  httpRequesterFn : retreiveMyAppRequester ,
  mainDataSetFilePath : "test/dataset/devises.json" ,
  entityToAddFilePath : "test/dataset/new_devise.json" ,
  entityToUpdateFilePath : "test/dataset/update_devise.json" ,
  mainPrivateURL:"/devise-api/v1/private/devises" ,
  mainPublicURL:"/devise-api/v1/public/devises" ,
  extractIdFn : (devise) => devise.code ,
  setIdFn: (devise,id) => { devise.code = id } ,
  testEssentialSameValues: (e1,e2) => {
      expect(e1.name).to.equal(e2.name);
      expect(e1.change).to.equal(e2.change);
   }
}

classicHttpCrudTest(testContext);
