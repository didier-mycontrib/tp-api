import mongoose from 'mongoose';
import dbMongoose from './db-mongoose.js';
import { readJsonTextFile } from './generic-file-util.js'
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

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example : 618d53514e0720e69e2e54c8
 *         username:
 *           type: string
 *           example : user1
 *         firstName:
 *           type: string
 *           example : jean
 *         lastName:
 *           type: string
 *           example: Bon
 *         email:
 *           type: string
 *           example : "jean.Bon@worldcompany.com"
 *         newPassword:
 *           type: string
 *           example : pwd1
 *         mainGroup:
 *           type: string
 *           example : user_of_sandboxrealm
 * 
 *     UserArray:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/User"
 *
 */      
     
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

async function reinit_db(){
  try{
    const deleteAllFilter = { }
    await ThisPersistentModelFn().deleteMany( deleteAllFilter);

    let entitiesFromFileDataSet = await readJsonTextFile("dataset/default_users.json");
    for(let e of entitiesFromFileDataSet){
        await  (new ThisPersistentModelFn()(e)).save();
      }
    return{action:"users collection re-initialized in mongoDB database"}; //as Promise
   } catch(ex){
     console.log(JSON.stringify(ex));
     throw ex;
  }
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
