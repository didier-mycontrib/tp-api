//V2 (essentiel ok , compatible mongoose 7 sans callback) - peaufinable

function findByIdWithModel(id,PersistentModel) {
    return new Promise( (resolve,reject)=>{
      PersistentModel.findById( id )
          .then((entity)=>{ if(entity == null) 
                              reject({error:'NOT_FOUND' , reason : "no entity found with id="+id});
                            else resolve(entity);
                          })
          .catch((err)=>{ reject({error:'can not find by id' , cause : err}); }  );

    });
  }
  
  
  
  //exemple of criteria : {} or { unitPrice: { $gte: 25 } } or ...
  function findByCriteriaWithModel(criteria,PersistentModel) {
    return new Promise( (resolve,reject)=>{
      PersistentModel.find( criteria)
                    .then((entities)=>{ resolve(entities);  })
                    .catch((err)=>{ reject({error:'can not find' , cause : err}); }  );
     });
  }
  
  function saveWithModel(entity,PersistentModel) {
    return new Promise( (resolve,reject)=>{
      let  persistentEntity = new PersistentModel(entity);
      persistentEntity.save()
                  .then((savedEntity)=>{ entity.id = savedEntity.id;  resolve(entity);  })
                  .catch((err)=>{ 
                    if(err && err.code == 11000)
                      reject({ error : "CONFLICT" , reason : "existing entity with same id"  });
                    else
                      reject({error : "cannot insert in database" , cause : err});
                   }  );
    });
  }
  
  function updateOneWithModel(newValueOfEntityToUpdate,idOfEntityToUpdate,PersistentModel) {
    return new Promise( (resolve,reject)=>{
      const filter = { _id :  idOfEntityToUpdate };
      //console.log("filter of updateOne=" +JSON.stringify(filter));
      PersistentModel.updateOne(filter , newValueOfEntityToUpdate)
                  .then((opResultObject)=>{ 
                    console.log("opResultObject of updateOne=" +JSON.stringify(opResultObject))
                    if(opResultObject.matchedCount == 1)
                       resolve(newValueOfEntityToUpdate);
                    else reject({ error : "NOT_FOUND" , reason : "no entity to update with id=" + idOfEntityToUpdate });
                    })
                  .catch((err)=>{ reject({ error : "cannot updateOne " , cause :  err}); }  );
    });
  }
  
  function deleteOneWithModel(idOfEntityToDelete,PersistentModel) {
    return new Promise( (resolve,reject)=>{
      const filter = { _id : idOfEntityToDelete };
      console.log("filter of deleteOne=" +JSON.stringify(filter));
      PersistentModel.deleteOne(filter )
                .then((opResultObject)=>{ 
                  console.log("opResultObject of deleteOne=" +JSON.stringify(opResultObject))
                  if(opResultObject.deletedCount == 1) resolve({ deletedId : idOfEntityToDelete });
                    else reject({ error : "NOT_FOUND" , reason : "no entity to delete with id=" + idOfEntityToDelete });
                  })
                .catch((err)=>{ reject({ error : "cannot delete " , cause :  err}); }  );
    });
  }


export default { findByIdWithModel , findByCriteriaWithModel , saveWithModel , updateOneWithModel , deleteOneWithModel }