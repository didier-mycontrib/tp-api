export function statusCodeFromEx(ex){
	let status = 500;
	let error = ex?ex.error:null ; 
	switch(error){
		case "BAD_REQUEST" : status = 400; break;
		case "NOT_FOUND" : status = 404; break;
		//...
		case "CONFLICT" : status = 409; break;
		default: status = 500;
	}
	return status;
}


export function nullOrEmptyObject(obj){
	return obj==null || ( Object.keys(obj).length === 0 && obj.constructor === Object );
}

export function build_api_uris(api_name,api_version,entities_name){
	//ex: api_name="xyz" , api_version="v1" , entities_name = "zzzs"
	const api_base_uri=`/${api_name}/${api_version}`  // ex: "/xyz-api/v1"
	const public_api_base_uri=`${api_base_uri}/public` // ex: "/xyz-api/v1/public"
	const private_api_base_uri=`${api_base_uri}/private` // ex: "/xyz-api/v1/private"

	const public_col_base_uri=`${public_api_base_uri}/${entities_name}` // ex: "/xyz-api/v1/public/zzzs"
	const private_col_base_uri=`${private_api_base_uri}/${entities_name}` // ex: "/xyz-api/v1/private/zzzs"
	const public_with_id_base_uri=`${public_col_base_uri}/:id` // ex: "/xyz-api/v1/public/zzzs/:id"
	const private_with_id_base_uri=`${private_col_base_uri}/:id` // ex: "/xyz-api/v1/private/zzzs/:id"
	return { 
		   api_name:api_name,
		   api_version:api_version,
		   entities_name:entities_name,
		   api_base_uri: api_base_uri, 
		   public_api_base_uri : public_api_base_uri, 
		   private_api_base_uri : private_api_base_uri,
		   public_col_base_uri:public_col_base_uri,
		   private_col_base_uri:private_col_base_uri,
		   public_with_id_base_uri:public_with_id_base_uri,
		   private_with_id_base_uri:private_with_id_base_uri
	}
}

export function addDefaultPrivateReInitRoute(apiRouter,dao,api_uris){
	//exemple URL: .../xyz-api/v1/private/reinit
    apiRouter.route(`${api_uris.private_api_base_uri}/reinit`)
	.get( async function(req , res  , next ) {
		try{
			let doneActionMessage = await dao.reinit_db();
			res.send(doneActionMessage);
		} catch(ex){
			console.log("ex:"+ex)
			res.status(statusCodeFromEx(ex)).send(ex);
		} 
	});
}

export function addDefaultGetByIdRoute(apiRouter,dao,api_uris,visibility,optionalTransformFn){
	//visibility = "private" or "public"
	//optionalTransformFn = optional transformation function to apply in found entity before send
    const route_uri = visibility=="private"?api_uris.private_with_id_base_uri:api_uris.public_with_id_base_uri
	//ex: /xyz-api/v1/private/zzzs/:id
	apiRouter.route(route_uri)
	.get( async function(req , res  , next ) {
		var idRes = req.params.id;
		try{
			let entity = await dao.findById( idRes);
			if(optionalTransformFn){
				optionalTransformFn(entity);
			}
			res.send(entity);
		} catch(ex){
			res.status(statusCodeFromEx(ex)).send(ex);
		} 
	});

}

export function addDefaultGetByCriteriaRoute(apiRouter,dao,api_uris,visibility,criteriaExtractFn,optionalTransformFn){
	//visibility = "private" or "public"
	//optionalTransformFn = optional transformation function to apply in found entities before send
    const route_uri = visibility=="private"?api_uris.private_col_base_uri:api_uris.public_col_base_uri
	//ex: /xyz-api/v1/private/zzzs
	apiRouter.route(route_uri)
	.get( async function(req , res  , next ) {
		const criteria = criteriaExtractFn?criteriaExtractFn(req):{}
		try{
			let entities = await dao.findByCriteria(criteria);
			if(optionalTransformFn){
				optionalTransformFn(entities);
			}
			res.send(entities);
		} catch(ex){
			res.status(statusCodeFromEx(ex)).send(ex);
		} 
	});
}

export function addDefaultPostRoute(apiRouter,dao,api_uris,optionalExtractIdFn,optionalPreTransformFn){
    const route_uri = api_uris.private_col_base_uri;
	//ex: /xyz-api/v1/private/zzzs
	apiRouter.route(route_uri)
	.post(async function(req , res  , next ) {
		var entity = req.body;
		console.log("posting  entity :" +JSON.stringify(entity));
		if(nullOrEmptyObject(entity)) { res.status(400).send(); return; } //BAD REQUEST
		try{
			if(optionalPreTransformFn)
			   optionalPreTransformFn(entity);
			let savedEntity = await dao.save(entity);
			let id = optionalExtractIdFn?optionalExtractIdFn(savedEntity):savedEntity.id; 
			res.location(`/${api_uris.entities_name}/${id}`).status(201).send(savedEntity);//201: successfully created
		} catch(ex){
			res.status(statusCodeFromEx(ex)).send(ex);
		}
	});
}

export function addDefaultPutRoute(apiRouter,dao,api_uris,optionalSetIdFn,optionalPreTransformFnWithIdresAndEntityToUpdate){
	  const route_uri = api_uris.private_with_id_base_uri;
	//ex: /xyz-api/v1/private/zzzs/:id
	apiRouter.route(route_uri)
	.put(async function(req , res  , next ) {
		var idRes = req.params.id;
		var entity = req.body;
		if(nullOrEmptyObject(entity)) { res.status(400).send(); return; } //BAD REQUEST
		console.log("update  entity of id=" +idRes); //  + ":" +JSON.stringify(entity));
		let verbose = req.query.v=="true"; //verbose mode ?v=true (default as false)
		try{
			if(optionalPreTransformFnWithIdresAndEntityToUpdate)
			   optionalPreTransformFnWithIdresAndEntityToUpdate(idRes,entity);
			else
			  entity.id=idRes;
			let updatedEntity = await dao.updateOne(entity);
			if(verbose)
			  res.send(updatedEntity); //200:OK with updated entity as Json response body
			else
			  res.status(204).send();//NO_CONTENT
		} catch(ex){
			console.log("ex:"+ex);
			res.status(statusCodeFromEx(ex)).send(ex);
		}
	});
}

export function addDefaultDeleteRoute(apiRouter,dao,api_uris){
    const route_uri = api_uris.private_with_id_base_uri;
	//ex: /xyz-api/v1/private/zzzs/:id
	apiRouter.route(route_uri)
	.delete( async function(req , res  , next ) {
		var idRes = req.params.id;
		//console.log("DELETE,idRes="+idRes);
		let verbose = req.query.v=="true"; //verbose mode (default as false)
		try{
			let deleteActionMessage = await dao.deleteOne(idRes);
			if(verbose)
				res.send(deleteActionMessage);
			else
				res.status(204).send();//NO_CONTENT
		} catch(ex){
			res.status(statusCodeFromEx(ex)).send(ex);
		}
	});
	
}