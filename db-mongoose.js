import mongoose from 'mongoose';

var mongoDbUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017"; //by default
//ou bien "mongodb://superuser:motdepasse@127.0.0.1:27017"


console.log("mongoDbUrl="+mongoDbUrl);
mongoose.connect(mongoDbUrl, {useNewUrlParser: true, 
	                              useUnifiedTopology: true , 
                                user : "" , pass : "" ,
                                /*user: "username_telque_superuser" , pass : "motdepasse",*/
								  dbName : 'tp_db'});
var thisDb  = mongoose.connection;

thisDb.on('error' , function() { 
      console.log("mongoDb connection error = " + " for dbUrl=" + mongoDbUrl )
    });

thisDb.once('open', function() {
      // we're connected!
      console.log("Connected correctly to mongodb database" );
    });

export default { thisDb } ;

