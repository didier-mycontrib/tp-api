import mongoose from 'mongoose';
import { readBasicTextFile } from './generic-file-util.js'

async function thisDbFn(){
   let mongoDbUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017"; //by default
   let mongoDbHostname = process.env.MONGODB_HOSTNAME || "127.0.0.1"; //by default
   let mongoDbPort = process.env.MONGODB_PORT || "27017"; //by default
   let mongoDbUsername = process.env.MONGODB_USERNAME ;
   let mongoDbPassword = process.env.MONGODB_PASSWORD ; 
   let mongoDbPasswordFile = process.env.MONGODB_PASSWORD_FILE ; //if password in secret file
   if(process.env.MONGODB_HOSTNAME){
	   //MONGODB_HOSTNAME est une variable d'env plus prioritaire que 
	   mongoDbUrl = `mongodb://${mongoDbHostname}:${mongoDbPort}` 
   }
   if(process.env.MONGODB_PASSWORD_FILE){
	   //MONGODB_PASSWORD_FILE est une variable d'env plus prioritaire que MONGODB_PASSWORD
	   console.log("password is stored in basic secret file:= " + mongoDbPasswordFile);
	   mongoDbPassword = await readBasicTextFile(mongoDbPasswordFile);
	   //console.log("mongoDbPassword (read from file)= " + mongoDbPassword);
   }
   console.log("mongoDbUrl="+mongoDbUrl);
   let cnxOptions = {}
   if(process.env.TEST_MODE=="IT"){
      cnxOptions = { directConnection: true , dbName : 'tp_db' }
    }
    else{
      cnxOptions = { dbName : 'tp_db'}
    }
	
	if(mongoDbUsername && mongoDbPassword){
		//console.log("mongoDbPassword = " + mongoDbPassword);
		cnxOptions.auth = { username : mongoDbUsername , password : mongoDbPassword };
		//console.log("cnxOptions.auth= " + JSON.stringify(cnxOptions.auth));
	}

   
   mongoose.connect(mongoDbUrl, cnxOptions);
   var thisDb  = mongoose.connection;

    thisDb.on('error' , function() { 
      console.log("mongoDb connection error = " + " for dbUrl=" + mongoDbUrl )
    });

    thisDb.once('open', function() {
      // we're connected!
      console.log("Connected correctly to mongodb database" );
    });

    return thisDb;

}
//export default { thisDb } ; //old static version
export default { thisDbFn } ; //new dynamic version (must be called)

