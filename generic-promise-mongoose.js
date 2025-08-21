//V1 (essentiel ok) - peaufinable

async function findByIdWithModel(id,PersistentModel) {
    try{
          let entity = await PersistentModel.findById( id )
          if(entity == null) reject({error:'NOT_FOUND' , 
                                     reason : "no entity found with id="+id});
          /*else*/ return entity;
    }catch(ex){
         throw {error:'can not find by id' , cause : ex}
    }
  }
  
  //exemple of criteria : {} or { unitPrice: { $gte: 25 } } or ...
  async function findByCriteriaWithModel(criteria,PersistentModel) {
    try{
          let entities = await PersistentModel.find(criteria);
          return entities;
    }catch(ex){
         console.error("error in findByCriteriaWithModel:" + ex)
         throw {error:'can not find ' , cause : ex}
    }
  }
  
  async function saveWithModel(entity,PersistentModel) {
    try{
      let  persistentEntity = new PersistentModel(entity);
      let savedEntity = await persistentEntity.save()
      entity.id = savedEntity.id;
      return entity;
    }catch(ex){
         console.error("error in saveWithModel:" + ex)
         throw {error:'cannot insert in database ' , cause : ex}
    }
  }
  
  async function updateOneWithModel(newValueOfEntityToUpdate,idOfEntityToUpdate,PersistentModel) {
    try{
      const filter = { _id :  idOfEntityToUpdate };
      //console.log("filter of updateOne=" +JSON.stringify(filter));
      let opResultObject = await PersistentModel.updateOne(filter , newValueOfEntityToUpdate);
      console.log("opResultObject of updateOne=" +JSON.stringify(opResultObject))
      if(opResultObject.matchedCount == 1)
          return newValueOfEntityToUpdate;
      else throw { error : "NOT_FOUND" , 
                 reason : "no entity to update with id=" + idOfEntityToUpdate }
    }catch(ex){
         console.error("error in updateOneWithModel:" + ex)
         throw {error:'cannot updateOne ' , cause : ex}
    }
  }
  
  async function deleteOneWithModel(idOfEntityToDelete,PersistentModel) {
    try{
      const filter = { _id : idOfEntityToDelete };
     // console.log("filter of deleteOne=" +JSON.stringify(filter));
      let opResultObject = await PersistentModel.deleteOne(filter);
      //console.log("opResultObject of deleteOne=" +JSON.stringify(opResultObject))
      if(opResultObject.deletedCount == 1) 
          return { deletedId : idOfEntityToDelete };
      else throw { error : "NOT_FOUND" , 
                   reason : "no entity to delete with id=" + idOfEntityToDelete }
    }catch(ex){
         console.error("error in deleteOneWithModel:" + ex)
         throw {error:'cannot delete ' , cause : ex}
    }
  }


export default { findByIdWithModel , findByCriteriaWithModel , saveWithModel , updateOneWithModel , deleteOneWithModel }