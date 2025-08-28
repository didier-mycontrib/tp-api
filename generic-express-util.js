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


/*
in prod/secure mode , public routes redirected to private route   are blocked . It's work only in dev mode 
-----
SOLUTION RETENUE pour le code générique "generic-express-util"
devant fonctionner de DEV et en PROD (et en mode TP ou PAS).
-----
par défaut si api_uris.api ne commence pas par tp/ alors mode ordinaire strict:
   - put,post,delete et reinit seulement en mode private
   et 
   - get selon choix au cas par cas (confidentiel ou pas)
si par contre api_uris.api commence pas par tp/ alors exceptionnellement:
   - put,post,delete et reinit accessible à la fois en mode private et en mode public
   (double uri , alias)
   - pour get demandé private alors accès possible à la fois en mode public et private

*/

export function addDefaultPrivateReInitRoute(apiRouter,dao,api_uris){
	//exemple URL: .../xyz-api/v1/private/reinit
	let reinit_route = `${api_uris.private_api_base_uri}/reinit`
	if(api_uris.api_name.startsWith("tp/"))
		reinit_route = [ reinit_route , `${api_uris.public_api_base_uri}/reinit`]
    apiRouter.route(reinit_route)
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

//ex: methods=["get","put","delete"] or [ "post"] or ...
export function addRedirectPublicToPrivateRoute(apiRouter,publicUrl,methods){
	let privateUrl = publicUrl.replace(/public/,"private")
    privateUrl = privateUrl.replace(/:id/,"${req.params.id}")
    let route_handler_callback_as_string = " res.redirect( 307, `" + privateUrl + "`); "; //307 for coorect post redirect
	let route_handler_callback = Function("req","res",route_handler_callback_as_string)
    //console.log("route_handler_callback="+route_handler_callback)
	for(const method of methods){
		//console.log(`addRedirectPublicToPrivateRoute publicUrl=${publicUrl} method=${method} privateUrl=${privateUrl} route_handler_callback=${route_handler_callback} `)
     if(method=='get')
		apiRouter.route(publicUrl).get(route_handler_callback );
	 else if(method=='post')
		apiRouter.route(publicUrl).post( route_handler_callback );
	 else if(method=='put')
		apiRouter.route(publicUrl).put( route_handler_callback);
	 else if(method=='delete')
		apiRouter.route(publicUrl).delete( route_handler_callback);
   }  
	
}

export function addRedirectPrivateToPublicRoute(apiRouter,privateUrl,methods){
	let publicUrl = privateUrl.replace(/private/,"public")
    publicUrl = publicUrl.replace(/:id/,"${req.params.id}")
    let route_handler_callback_as_string = " res.redirect( 307, `" + publicUrl + "`); "; //307 for coorect post redirect
	let route_handler_callback = Function("req","res",route_handler_callback_as_string)
    //console.log("route_handler_callback="+route_handler_callback)
	for(const method of methods){
		//console.log(`addRedirectPublicToPrivateRoute publicUrl=${publicUrl} method=${method} privateUrl=${privateUrl} route_handler_callback=${route_handler_callback} `)
     if(method=='get')
		apiRouter.route(privateUrl).get(route_handler_callback );
	 else if(method=='post')
		apiRouter.route(privateUrl).post( route_handler_callback );
	 else if(method=='put')
		apiRouter.route(privateUrl).put( route_handler_callback);
	 else if(method=='delete')
		apiRouter.route(privateUrl).delete( route_handler_callback);
   }  
	
}


export function addDefaultGetByIdRoute(apiRouter,dao,api_uris,visibility,optionalTransformFn){
	//visibility = "private" or "public" 
	//optionalTransformFn = optional transformation function to apply in found entity before send
    let route_uri = visibility=="private"?api_uris.private_with_id_base_uri:api_uris.public_with_id_base_uri
	if(api_uris.api_name.startsWith("tp/") && visibility=="private")
		route_uri = [ route_uri , api_uris.public_with_id_base_uri]
	//ex: /xyz-api/v1/private/zzzs/:id
	apiRouter.route(route_uri)
	.get( async function(req , res  , next ) {
		let idRes = req.params.id;
		const unique_property_name_as_id = req.query.unique_property_name_as_id;
		try{
			let entity =null;
			if(unique_property_name_as_id){
				//idRes interprété comme unique valeur de la chose recherchée selon unique_property_name_as_id
				//ex par username, par email, ...
               let criteria={}; criteria[unique_property_name_as_id] = idRes;
			   let entities = await dao.findByCriteria(criteria);
			   if(entities.length==1)
		         entity = entities[0];
			   else 
				throw {error : "NOT_FOUND" , reason : "no entity with "  +unique_property_name_as_id + "=" +  idRes}
			}else{
              //by default (idRes interprété par id/pk souvent générée automatiquement):
			  entity =  await dao.findById( idRes);
			}
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
    let route_uri = visibility=="private"?api_uris.private_col_base_uri:api_uris.public_col_base_uri
	if(api_uris.api_name.startsWith("tp/") && visibility=="private")
		route_uri = [ route_uri , api_uris.public_col_base_uri]
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


//async optionalUnicityTest may be operate a unicity test and may throw execption if case of conflict

export function addDefaultPostRoute(apiRouter,dao,api_uris,optionalExtractIdFn,optionalPreTransformFn,optionalUnicityTest){
    let route_uri = api_uris.private_col_base_uri;
	if(api_uris.api_name.startsWith("tp/"))
		route_uri = [ route_uri , api_uris.public_col_base_uri ]
	//ex: /xyz-api/v1/private/zzzs
	apiRouter.route(route_uri)
	.post(async function(req , res  , next ) {
		var entity = req.body;
		console.log("posting  entity :" +JSON.stringify(entity));
		if(nullOrEmptyObject(entity)) { res.status(400).send(); return; } //BAD REQUEST
		try{
			if(optionalUnicityTest)
			   await optionalUnicityTest(entity);
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
	let route_uri = api_uris.private_with_id_base_uri;
	if(api_uris.api_name.startsWith("tp/"))
		route_uri = [ route_uri , api_uris.public_with_id_base_uri ]
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

//by default: delete by id (/:id) , 
//if optionalUniquePropertyName not null , delete by optionalUniquePropertyName (at end of path)
export function addDefaultDeleteRoute(apiRouter,dao,api_uris){
    let route_uri = api_uris.private_with_id_base_uri;
	if(api_uris.api_name.startsWith("tp/"))
		route_uri = [ route_uri , api_uris.public_with_id_base_uri ]
	//ex: /xyz-api/v1/private/zzzs/:id or /xyz-api/v1/private/zzzs/:username or :email or ..
	apiRouter.route(route_uri)
	.delete( async function(req , res  , next ) {
		const unique_property_name_as_id = req.query.unique_property_name_as_id;
		let idRes = req.params.id;
		//console.log("DELETE,idRes="+idRes);
		let verbose = req.query.v=="true"; //verbose mode (default as false)
		try{
			let deleteActionMessage="{}"
			if(unique_property_name_as_id){
			     let criteria={}; criteria[unique_property_name_as_id] = idRes;
				 deleteActionMessage = await dao.ThisPersistentModelFn().deleteOne(criteria);
			}else{
				//delete by id by default
				deleteActionMessage = await dao.deleteOne(idRes);
			}
			if(verbose)
				res.send(deleteActionMessage);
			else
				res.status(204).send();//NO_CONTENT
		} catch(ex){
			console.log("addDefaultDeleteRoute, ex"+ex)
			res.status(statusCodeFromEx(ex)).send(ex);
		}
	});
	
}