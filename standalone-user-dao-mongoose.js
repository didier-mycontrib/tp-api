import mongoose from 'mongoose';
import dbMongoose from './db-mongoose.js';
import genericPromiseMongoose from './generic-promise-mongoose.js';//generic helper for entity model with  .id , ._id

var thisDb = dbMongoose.thisDb;

//NB: This is for current entity type ("Devise" or "Customer" or "Product" or ...)
//NB: thisSchema end ThisPersistentModel should not be exported (private only in this current module)
var thisSchema;//mongoose Shcema (structure of mongo document)
var ThisPersistentModel; //mongoose Model (constructor of persistent ThisPersistentModel)

function initMongooseWithSchemaAndModel () {

    //default auto generated objectId of mongoDB is better than number auto_incr
    //because it is more unique (no problem with objectId, but risk of same id  if auto_incr is reset)
   
    mongoose.Connection = thisDb;
      thisSchema = new mongoose.Schema({
       // default _id 
        username: String  ,
        firstName: String  ,
        lastName: String  ,
        email: String  ,
        newPassword: String  ,
        mainGroup : String
      });
     
      //NB: la partie "password" devrait idéalement jamais être stockée telle quelle
      // mais cryptée via bcrypt

      thisSchema.set('id',true); //no default virtual id alias for _id
      thisSchema.set('toJSON', { virtuals: true , 
                                   versionKey:false,
                                   transform: function (doc, ret) {   delete ret._id;  }
                                 });                             
      //console.log("mongoose thisSchema : " + JSON.stringify(thisSchema) );
      //"Login" model name is "users" collection name in mongoDB  database
      ThisPersistentModel = mongoose.model('user', thisSchema);
}

initMongooseWithSchemaAndModel();

function reinit_db(){
  return new Promise( (resolve,reject)=>{
    const deleteAllFilter = { }
    ThisPersistentModel.deleteMany( deleteAllFilter)
                .then(()=>{ //insert elements after deleting olds
                  (new ThisPersistentModel({ username : "admin1" , newPassword : "pwd1" , firstName : "jean" , lastName : "Bon" , email : "jean.Bon@worldcompany.com" , mainGroup : "admin_of_sandboxrealm" })).save();
                  (new ThisPersistentModel({ username : "mgr1" , newPassword : "pwd1" , firstName : "axelle" , lastName : "Aire" , email : "axelle.aire@worldcompany.com" , mainGroup : "manager_of_sandboxrealm" })).save();
                  (new ThisPersistentModel({ username : "user1" , newPassword : "pwd1"  , firstName : "luc" , lastName : "Skywalker" , email : "luc.Skywalker@worldcompany.com" , mainGroup : "user_of_sandboxrealm" })).save();
                  resolve({action:"users collection re-initialized in mongoDB database"})
                  })
                .catch((err)=>{ console.log(JSON.stringify(err)) ; 
                                reject({error : "cannot delete in database" , cause : err}); }  );
  });
}

function findById(id) {
  return genericPromiseMongoose.findByIdWithModel(id,ThisPersistentModel);
}

//exemple of criteria : {} or { unitPrice: { $gte: 25 } } or ...
function findByCriteria(criteria) {
  return genericPromiseMongoose.findByCriteriaWithModel(criteria,ThisPersistentModel);
}

function save(entity) {
  return genericPromiseMongoose.saveWithModel(entity,ThisPersistentModel);
}

function updateOne(newValueOfEntityToUpdate) {
  return genericPromiseMongoose.updateOneWithModel(newValueOfEntityToUpdate,newValueOfEntityToUpdate.id,ThisPersistentModel);
}

function deleteOne(idOfEntityToDelete) {
  return genericPromiseMongoose.deleteOneWithModel(idOfEntityToDelete,ThisPersistentModel);
}


export default { ThisPersistentModel ,  reinit_db ,
   findById , findByCriteria , save , updateOne ,  deleteOne};
