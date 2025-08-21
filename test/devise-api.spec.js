import {use} from  'chai';
import chaiHttp  from 'chai-http';
import { app , server } from '../server.js';
import { MongoDBContainer } from '@testcontainers/mongodb'


//NB: in script (.sh, .bat , ...) : set/export WITHOUT_AUTH=yes // undefined by default
//WITHOUT THAT , security (auth check) will block private requests (post, ..)

const chai=use(chaiHttp); //configure chai to use chaiHttp
//NB: run mocha with --exit option for good server exit after test execution

const { expect } = chai;

//add devises dataSet before begin of all tests
async function initDevisesDataSet(){
   let listeDevises=[];
   const requester = retreiveMyAppRequester().keepOpen(); //for multiple requests , must be explicitly closed
   try{
    listeDevises.push({code:"EUR_Test",name:"Euro_test",change:1}); 
    listeDevises.push({code:"USD_Test",name:"Dollar_test",change:1.2}); 
    listeDevises.push({code:"GBP_Test",name:"Livre_test",change:0.9}); 
    listeDevises.push({code:"JPY_Test",name:"Yen_test",change:123.5}); 
    for(let dev of listeDevises){
      //const requester = retreiveMyAppRequester(); //for one request ==> automatically closed
      const resPostDevise = await requester.post('/devise-api/v1/private/devises')
                      .send(dev);
        //dev.code = resPostDevise.body.code; //no auto_incr here !!!
   }
  }catch(ex){
    console.log("ex="+ex);
  }finally{
    requester.close();
  }
  return listeDevises;
}

//REMOVE devises dataSet after end of all tests
async function removeDevisesDataSet(listeDevises){
    
     for(let d of listeDevises){
       const requester = retreiveMyAppRequester();
          let url='/devise-api/v1/private/devises/'+d.code
         const resDeleteDevise = await requester.delete(url)
     }
     console.log("data set remove at end of all tests")
}

describe("rest devise-api tests", ()=>{
  let mongodbContainer=null;//for integration-test (in jenkins or ...)

  let devises = []; //part of data-set

  
	before(async () =>{

     mongodbContainer=await initMongodbContainer(); //utile seulement en mode IT (avec jenkins ou ...)
  
     console.log("initialisations before all tests of devise-api.spec (dataset or ...)");
    //insertion d'un jeu de données via http call:
    devises = await initDevisesDataSet();
    for(let dev of devises){
        console.log("dev.code="+dev.code + " was post");
    }
   
    
  }).timeout(800000); //grande valeur de timeout car premier démarrage lent (éventuelle téléchargement de l'image docker)

  after(async ()=>{
    console.log("terminaison after all tests of devise-api.spec ");
    //delete dataset:
    await removeDevisesDataSet(devises)

     if(process.env.TEST_MODE=="IT"){
      //stop mongodbContainer (in integration test mode):
     await mongodbContainer.stop();
     }
  });
	
 it("/devise-api/v1/public/devise , status 200 and at least one devise", async () =>{
      const requester = retreiveMyAppRequester();
      const res = await requester.get('/devise-api/v1/public/devises');
      expect(res).to.have.status(200);
      let jsBody = res.body;//as array of qcm
      //console.log("devise list"+JSON.stringify(jsBody));
      expect(jsBody.length).to.be.at.least(1);
   });

   it("/devise-api/v1/public/devises/idOfFirstDevise returns status 200 and good values of devise", async () =>{
    const requester = retreiveMyAppRequester();
      let firstDevise = devises[0];
      console.log("get devise.code="+firstDevise.code);
      const res = await requester.get('/devise-api/v1/public/devises/'+firstDevise.code);
      expect(res).to.have.status(200);
      let jsBody = res.body;// qcm object
      console.log("reloaded values of firstDevise=" +JSON.stringify(jsBody));
      expect(jsBody.name).to.equal(firstDevise.name);
      expect(jsBody.change).to.equal(firstDevise.change);
      //...
   });

    it("post /devise-api/v1/private/devises  return status 201 ", async () =>{

      let deviseDKK = {code:"DKK_Test",name:"CouronneDanoise_test",change:7.5}

       const requester = retreiveMyAppRequester();
       const resPostDevise = await requester.post('/devise-api/v1/private/devises')
                     .send(deviseDKK);
      expect(resPostDevise).to.have.status(201);
      //console.log("devise POST status=" + resPostDevise.status);
      console.log("devise POST result:="+ JSON.stringify(resPostDevise.body))
      devises.push(deviseDKK); //add to devises list for automatic remove at after() stage of test
    });

});

//GENERIC FUNCTIONS (idem for other tests):

function retreiveMyAppRequester(){
    return chai.request.execute(app);//"http://localhost:8230" or ...
    //NB: this code may change in other chai,chaiHttp versions
}


async function initMongodbContainer(){
  let mongodbContainer=null;
     if(process.env.TEST_MODE=="IT"){
        try{
          mongodbContainer = await new MongoDBContainer("mongo:8.0.12").start()
          console.log("mongodbContainer connexion string: "+mongodbContainer.getConnectionString());
          process.env.MONGODB_URL=mongodbContainer.getConnectionString()
        }catch(ex){
          console.log("err start mongodbContainer:"+ex)
        }
      }
     return mongodbContainer;
}