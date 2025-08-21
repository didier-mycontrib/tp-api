import { MongoDBContainer } from '@testcontainers/mongodb'
import { expect} from 'chai'
import mongoose from 'mongoose';


describe("basic mongoContainer test", ()=>{


  let mongodbContainer=null;//for integration-test (in jenkins or ...)


	before(async () =>{
     if(process.env.TEST_MODE=="IT"){
        try{
          mongodbContainer = await new MongoDBContainer("mongo:8.0.12").start()
          console.log("mdb:"+mongodbContainer.getConnectionString());
          process.env.MONGODB_URL=mongodbContainer.getConnectionString()
        }catch(ex){
          console.log("err start mongodbContainer:"+ex)
        }
     }
  }).timeout(120000);

  after(async ()=>{
     if(process.env.TEST_MODE=="IT"){
      //stop mongodbContainer (in integration test mode):
     await mongodbContainer.stop();
     }
  });
	
it("basic mongoose test with @testcontainers/mongodb", async () =>{

     const db = mongoose.createConnection(process.env.MONGODB_URL, { directConnection: true });

    const obj = { value: 1 };
    const collection = db.collection("test");
    await collection.insertOne(obj);

    const result = await collection.findOne({ value: 1 });
    console.log(JSON.stringify(result));
    expect(result.value).to.equal(obj.value);

    await db.close();
   });


});