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
        _id: { type : String , alias : "code" } ,
        name: String   ,
        change : Number
      });

/**
 * @openapi
 * components:
 *   schemas:
 *     Devise:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           example : EUR
 *         name:
 *           type: string
 *           example : Euro
 *         change:
 *           type: number
 *           format: double
 *           example : 1.0
 * 
 *     DeviseArray:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/Devise"
 *
 */


      thisSchema.set('id',false); //no default virtual id alias for _id
      thisSchema.set('toJSON', { virtuals: true , 
                                   versionKey:false,
                                   transform: function (doc, ret) {   delete ret._id;  }
                                 });                             
      //console.log("mongoose thisSchema : " + JSON.stringify(thisSchema) );
      //"Devise" model name is "devises" collection name in mongoDB  database
      ThisPersistentModel = mongoose.model('Devise', thisSchema);
}

function ThisPersistentModelFn(){
  if(ThisPersistentModel==null)
      initMongooseWithSchemaAndModel();
  return ThisPersistentModel;
}

async function reinit_db(){
    try {
      const deleteAllFilter = { }
      await ThisPersistentModelFn().deleteMany( deleteAllFilter);
      let entitiesFromFileDataSet = await readJsonTextFile("dataset/default_devises.json");
      for(let e of entitiesFromFileDataSet){
        await  (new ThisPersistentModelFn()(e)).save();
      }
      return {action:"devises collection re-initialized in mongoDB database"}; //as Promise
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
  return genericPromiseMongoose.updateOneWithModel(newValueOfEntityToUpdate,newValueOfEntityToUpdate.code,ThisPersistentModelFn());
}

function deleteOne(idOfEntityToDelete) {
  return genericPromiseMongoose.deleteOneWithModel(idOfEntityToDelete,ThisPersistentModelFn());
}



export default { ThisPersistentModelFn ,  reinit_db ,   findById , findByCriteria , save , updateOne ,  deleteOne};
