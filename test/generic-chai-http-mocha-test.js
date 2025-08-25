import { MongoDBContainer } from '@testcontainers/mongodb'
import { readJsonTextFile } from '../generic-file-util.js'


//load main dataset from file and saved it via http/post requests
export async function initMainDataSet(testContext ){
   let listeSavedEntities=[];
   let entitiesFromFileDataSet = await readJsonTextFile(testContext.mainDataSetFilePath);
   console.log("entitiesFromFileDataSet="+JSON.stringify(entitiesFromFileDataSet))
   const requester = testContext.httpRequesterFn().keepOpen(); //for multiple requests , must be explicitly closed
   try{
      for(let e of entitiesFromFileDataSet){
      //const requester = testContext.httpRequesterFn(); //for one request ==> automatically closed
      const resPost = await requester.post(testContext.mainPrivateURL)
                      .send(e);
      testContext.setIdFn(e,testContext.extractIdFn(resPost.body)) //copy/adjust genrated id if necessary
      listeSavedEntities.push(e);
   }
  }catch(ex){
    console.log("ex="+ex);
  }finally{
    requester.close();
  }
  return listeSavedEntities;
}

//REMOVE main dataSet after end of all tests
export async function removeMainDataSet(listeEntities,testContext){
    const requester = testContext.httpRequesterFn().keepOpen();
    try{
     for(let e of listeEntities){
         let url=testContext.mainPrivateURL+'/'+testContext.extractIdFn(e)
         const resDelete = await requester.delete(url)
     }
     console.log("main dataset removed (via http/delete) at end of all tests")
    }catch(ex){
    console.log("error when remove main dataset, ex="+ex);
  }finally{
    requester.close();
  }
}

export async function initMongodbContainer(){
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

export function firstLevelTestWithTestContainer(testSubGroups){
  describe("rest api classic http/crud tests with testContainer if necessary", ()=>{
  let mongodbContainer=null;//for integration-test (in jenkins or ...)

  before(async () =>{
    console.log("init testContainer if necessary");
    mongodbContainer=await initMongodbContainer(); //utile seulement en mode IT (avec jenkins ou ...)
    
  }).timeout(800000); //grande valeur de timeout car premier démarrage lent (éventuelle téléchargement de l'image docker)

  after(async ()=>{
    console.log("terminaison  within testContainer if necessary");
    
     if(process.env.TEST_MODE=="IT"){
      //stop mongodbContainer (in integration test mode):
     await mongodbContainer.stop();
     }
   
  });


  if(testSubGroups && testSubGroups.length > 0)
    describe(testSubGroups[0].name , testSubGroups[0].testFn)

  if(testSubGroups && testSubGroups.length > 1)
    describe(testSubGroups[1].name , testSubGroups[1].testFn)

  if(testSubGroups && testSubGroups.length > 2)
    describe(testSubGroups[2].name , testSubGroups[2].testFn)
  
  if(testSubGroups && testSubGroups.length > 3)
    describe(testSubGroups[3].name , testSubGroups[3].testFn)

  });

  
}


export function classicHttpCrudInnerTestObject(testContext,mySpecificSubGroupTests){
return {name:"rest api classic http/crud tests "+testContext.name, 
       testFn : ()=>{

  let mainEntities = []; //main data-set
  
	before(async () =>{


     console.log("initialisations before all tests of devise-api.spec (dataset or ...)");
    //insertion d'un jeu de données via http call:
    mainEntities = await initMainDataSet(testContext);
    testContext.mainEntities=mainEntities;
    
  });

  after(async ()=>{
    console.log("terminaison after all tests of devise-api.spec ");
    //delete main dataset:
    await removeMainDataSet(mainEntities,testContext);

  });
	
	 it("http get for retreive main dataset , status 200 and good size", async () =>{
      const requester = testContext.httpRequesterFn();
      const res = await requester.get(testContext.mainPublicURL);
      testContext.expect(res).to.have.status(200);
      let jsBody = res.body;//as array of entities
      //console.log("entities list (after hhtp get):"+JSON.stringify(jsBody));
      testContext.expect(jsBody.length).to.be.at.least(mainEntities.length);
   });

   it("http get for retreive first entity returns status 200 and good values of entity", async () =>{
      const requester = testContext.httpRequesterFn();
      let firstEntity = mainEntities[0];
      let idOfFirstEntity = testContext.extractIdFn(firstEntity)
      console.log("perform get http request with id="+idOfFirstEntity);
      const res = await requester.get(testContext.mainPublicURL+'/'+idOfFirstEntity);
      testContext.expect(res).to.have.status(200);
      let jsBody = res.body;// entity object
      console.log("reloaded values of first entity=" +JSON.stringify(jsBody));
      testContext.testEssentialSameValues(jsBody,firstEntity);//essential expect
   });

    it("post and put ok via http", async () =>{
      let entityToAddFromFileDataSet = await readJsonTextFile(testContext.entityToAddFilePath);

      let requester = testContext.httpRequesterFn();
      const resPost = await requester.post(testContext.mainPrivateURL)
                     .send(entityToAddFromFileDataSet);
      testContext.expect(resPost).to.have.status(201);
      console.log("entityToAdd POST result:"+ JSON.stringify(resPost.body))

      let entityToUpdateFromFileDataSet = await readJsonTextFile(testContext.entityToUpdateFilePath);
      
      //ensure that entityToUpdateFromFileDataSet have same id of resPost.body (may be generated):
      let idRes = testContext.extractIdFn(resPost.body);
      testContext.setIdFn(entityToUpdateFromFileDataSet,idRes);
      console.log("send entityToUpdate by HTTP/PUT :"+ JSON.stringify(entityToUpdateFromFileDataSet))
      requester = testContext.httpRequesterFn();
      const resPut = await requester.put(testContext.mainPrivateURL+"/"+idRes)
                     .send(entityToUpdateFromFileDataSet);
      testContext.expect(resPut).to.have.status(204);

      mainEntities.push(entityToUpdateFromFileDataSet); //add to mainEntities list for automatic remove at after() stage of test
    });

    if(mySpecificSubGroupTests)
      describe("specifics rest api tests" , mySpecificSubGroupTests)
  }};
 

}