import mongoose from 'mongoose';
import dbMongoose from './db-mongoose.js';
import genericPromiseMongoose from './generic-promise-mongoose.js';//generic helper for entity model with  .id , ._id


//NB: This is for current entity type ("Devise" or "Customer" or "Product" or ...)
//NB: thisSchema end ThisPersistentModel should not be exported (private only in this current module)
var thisSchema;//mongoose Shcema (structure of mongo document)
var ThisPersistentModel; //mongoose Model (constructor of persistent ThisPersistentModel)

function initMongooseWithSchemaAndModel () {

    //default auto generated objectId of mongoDB is better than number auto_incr
    //because it is more unique (no problem with objectId, but risk of same id  if auto_incr is reset)
   
    mongoose.Connection = dbMongoose.thisDbFn();
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

function ThisPersistentModelFn(){
  if(ThisPersistentModel==null)
      initMongooseWithSchemaAndModel();
  return ThisPersistentModel;
}

function reinit_db(){
  return new Promise( (resolve,reject)=>{
    const deleteAllFilter = { }
    ThisPersistentModelFn().deleteMany( deleteAllFilter)
                .then(()=>{ //insert elements after deleting olds
                  (new ThisPersistentModelFn()({ username : "admin1" , newPassword : "pwd1" , firstName : "jean" , lastName : "Bon" , email : "jean.Bon@worldcompany.com" , mainGroup : "admin_of_sandboxrealm" })).save();
                  (new ThisPersistentModelFn()({ username : "mgr1" , newPassword : "pwd1" , firstName : "axelle" , lastName : "Aire" , email : "axelle.aire@worldcompany.com" , mainGroup : "manager_of_sandboxrealm" })).save();
                  (new ThisPersistentModelFn()({ username : "user1" , newPassword : "pwd1"  , firstName : "luc" , lastName : "Skywalker" , email : "luc.Skywalker@worldcompany.com" , mainGroup : "user_of_sandboxrealm" })).save();
                  resolve({action:"users collection re-initialized in mongoDB database"})
                  })
                .catch((err)=>{ console.log(JSON.stringify(err)) ; 
                                reject({error : "cannot delete in database" , cause : err}); }  );
  });
}

function findById(id) {
  return genericPromiseMongoose.findByIdWithModel(id,ThisPersistentModelFn());
}

//exemple of criteria : {} or { unitPrice: { $gte: 25 } } or ...
function findByCriteria(criteria) {
  return genericPromiseMongoose.findByCriteriaWithModel(criteria,ThisPersistentModelFn());
}

function save(entity) {
  return genericPromiseMongoose.saveWithModel(entity,ThisPersistentModelFn());
}

function updateOne(newValueOfEntityToUpdate) {
  return genericPromiseMongoose.updateOneWithModel(newValueOfEntityToUpdate,newValueOfEntityToUpdate.id,ThisPersistentModelFn());
}

function deleteOne(idOfEntityToDelete) {
  return genericPromiseMongoose.deleteOneWithModel(idOfEntityToDelete,ThisPersistentModelFn());
}


export default { ThisPersistentModelFn ,  reinit_db ,
   findById , findByCriteria , save , updateOne ,  deleteOne};
