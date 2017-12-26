	/**********************************************************************
	*  routes.js handles the http requests
	**/
	
var initFunctions = require('../config/functions');		 // called functions file

//initialise required modules 
var passwordHash = require('password-hash'),
	cookieParser = require('cookie-parser');
module.exports = function(init, app,db){
	var mongodb=init.mongodb;
	
	//register page
	app.get('/register', function(req, res) {
		res.render('register', {
    		queryStr : req.query
    	});   
	});

	//sign in page
	app.get('/sign-in', function(req, res) {
		res.render('sign-in', {
    		queryStr : req.query
    	});   
	});

//index page
app.get('/', requireLogin, function(req, res) {
	if(req.authenticationBool){
		res.render('index', {
      		 authenticatedUser : req.authenticatedUser
   		});
    }else{
		res.redirect('/sign-in');
	}
}); 

//index page
app.get('/index', requireLogin, function(req, res) {
	if(req.authenticationBool){
		res.render('index', {
      		 authenticatedUser : req.authenticatedUser
   		});
    }else{
		res.redirect('/sign-in');
	}
});
//logout page
app.get('/logout', function(req, res) {
	if(req.cookies[init.cookieName] != null && req.cookies[init.cookieName] != 'undefined' && req.cookies[init.cookieName]!=""){
		var mongoIDField= new mongodb.ObjectID(req.cookies[init.cookieName]);
		res.clearCookie(init.cookieName); // delete the cookie
		// delete the record from sessions
		db.collection('sessions').remove({"_id":mongoIDField},function(err,result){
    		res.redirect('/sign-in');
    	});
   	}else{
   		res.redirect('/sign-in');
   	}	
});

//books listing
app.get('/api_fetch_data/', requireLogin, function(req, res) {
	var itemsPerPage = 10, pageNum=1, outputObj = new Object();
	if(req.query.start){
		pageNum=parseInt(req.query.start);
	}
	if(req.query.limit){
		itemsPerPage=parseInt(req.query.limit);
	}
	
	if(pageNum==0){
		pageNum=1;
	}
	if(req.authenticationBool){
			if(req.query.collection && req.query.collection!=""){
				var coll= db.collection(req.query.collection);    			
     			
     				var query="{";
     				if(req.query.collection=="books"){
     					query+="'status': { $in: [ 1, '1' ] }";
     				}
					if(req.query.filter_data && req.query.filter_data!==""){
						if(query!="{"){
     						query+=",";
     					}
						query+=" 'availability': { $in: [ "+req.query.filter_data+", '"+req.query.filter_data+"' ] }";
					}
     				
					if(req.query.s){
     					//create text index
     					coll.createIndex({ "$**": "text" },{ name: "TextIndex" });
     					if(query!="{"){
     						query+=",";
     					}
     					query+=" '$text': { '$search': '"+req.query.s+"' } ";
     				}
     				query+= "}";
     				eval('var queryObj='+query);
     				
     				coll.find(queryObj).count(function (e, count) {
     					if(count){
      						outputObj["total"]   = count;
      					} else {
      						outputObj["total"]   = 0;
      					}
      				});	
					coll.find(queryObj).sort({name: 1}).skip(pageNum-1).limit(itemsPerPage).toArray(function(err, items) {
						if (err) {
							outputObj["error"]   = 'Sorry, no more data found';
						} else if (items) {
      						outputObj["iTotalRecordsReturned"]   = items.length;
      						outputObj["aaData"]   = items;
						}
						res.send(outputObj);
					});
			}else{
				outputObj["total"]   = 0;
      			outputObj["error"]   = "Please pass the table name as required parameter!";
				res.send(outputObj);
			}
			
	}else{
		outputObj["total"]   = 0;
      	outputObj["error"]   = "Authorization error!";
		res.send(outputObj);
	}
}); 

 // render pages started with /
app.get('/:id', requireLogin, function(req, res) {
	if(req.authenticationBool){
		var contentObj= "", collectionNameStr="";
		if(req.params.id!==""){
			if(req.params.id=="book"){
				collectionNameStr="books";
			}else if(req.params.id=="user"){
				collectionNameStr="users";
			}
			if(collectionNameStr!=""){
				initFunctions.returnFindOneByMongoID(db, collectionNameStr, req.query._id, function(result) {
      				if (result.aaData) {
						res.render(req.params.id, {
      						queryStr : req.query,
       						contentObj : result.aaData,
       						authenticatedUser : req.authenticatedUser
   						});
   					}else{
   						res.render(req.params.id, {
      						queryStr : req.query,
       						contentObj : contentObj,
       						authenticatedUser : req.authenticatedUser
   						});
   					}
   				});
			}else{
				res.render(req.params.id, {
      				queryStr : req.query,
      				contentObj : contentObj,
       				authenticatedUser : req.authenticatedUser
   				});
			}
		}else{
			res.render(req.params.id, {
      			queryStr : req.query,
      			contentObj : contentObj,
       			authenticatedUser : req.authenticatedUser
   			});
   		}
   	}else{
		res.redirect('/sign-in');
	}
});
	//POST: validate user on login
app.post('/validatelogin', (req, res) => {
	var postJson=req.body;
	//search user with email
	var checkForExistence= '{"email": \''+postJson.email+'\', "status": { $in: [ 1, "1" ] }}';
	initFunctions.crudOpertions(db, 'users', 'findOne', null, null, null, checkForExistence, function(result) {
		if (result.aaData) {
			var document= result.aaData;
			//password hash is used to check passowrd
			if(passwordHash.verify(postJson.password, document.password)){
				initFunctions.saveSessionBeforeLogin(db, document._id, document.uuid_default_system, function(result) {		//save the session if user is valid
					if (result.success){
      					res.cookie(init.cookieName , result.cookie)
      					res.redirect(result.link);
      				}else{
      					res.redirect('/sign-in?error=no');
    				}
  				});
			}else{
      			res.redirect('/sign-in?error=password');
      		}
      	} else {
      		// search user by username
      		var checkForExistence= '{"username": \''+postJson.email+'\', "status": { $in: [ 1, "1" ] }}';
      		initFunctions.crudOpertions(db, 'users', 'findOne', null, null, null, checkForExistence, function(result) {
				if (result.aaData) {
					var document= result.aaData;
					
					if(passwordHash.verify(postJson.password, document.password)){
						initFunctions.saveSessionBeforeLogin(db, document._id, document.uuid_default_system, function(result) { 	//save the session if user is valid
							if (result.success){
      								res.cookie(init.cookieName , result.cookie)
      								res.redirect(result.link);
      						}else{
      							res.redirect('/sign-in?error=no');
    						}
  						});
					}else{
      					res.redirect('/sign-in?error=password');
      				}
      			} else {
      				res.redirect('/sign-in?error=no');
      		  	}
    		});
        }
    });
})
//save new registration
app.post('/save_registration', (req, res) => {
	var contentJson = JSON.parse(req.body.data), table_nameStr='users', link ="/register";
	var checkForExistence= '{\'email\': \''+contentJson.email+'\'}';
	
	contentJson['access_right'] = 1;
	contentJson['status'] = 0;
		if (typeof contentJson.password !== 'undefined' && contentJson.password !== null && contentJson.password != "") {
      		contentJson['password'] = passwordHash.generate(contentJson.password);
      	}
      	initFunctions.crudOpertions(db, table_nameStr, 'findOne', null, null, null, checkForExistence, function(result) {
			if (result.success=="OK") {
      			var document=result.aaData;
      			link+="?error_msg=User already exists!"
      			res.redirect(link);
      		} else {
      			contentJson.created=initFunctions.currentTimestamp();
      			db.collection(table_nameStr).save(contentJson, (err, result) => {
      				if (err) link+="?error_msg=Error occurred while saving, please try after some time!";
    				link+="?success_msg=Thank you, you are successfully registered in the system. Your account will be activated by administrator and informed you shortly!";
    				res.redirect(link)
  				});
      		}
      	});
})

//save details
app.post('/save/:id', requireLogin, (req, res) => {
	if(req.authenticationBool){
	var postJson=req.body;
	var contentJson = JSON.parse(postJson.data);	//all form content will be posted in field name="data"
	var idField="", editorFieldName="_id", editorFieldVal="";
	
	var table_nameStr=postJson.table_name;
	var unique_fieldStr=postJson.unique_field;
	if(unique_fieldStr=="_id"){
		unique_fieldStr="id";
	}
	var unique_fieldVal="";
	var link ="/"+req.params.id;
	
	for(var key in contentJson) {
		if(key==unique_fieldStr){
			unique_fieldVal= contentJson[key];
		}
	}
	
	if (typeof postJson.id !== 'undefined' && postJson.id !== null && postJson.id !== "") { 
		var mongoIDField= new mongodb.ObjectID(postJson.id);
		editorFieldVal= mongoIDField;
	}
	
	var callMongoQueriesBool=true; // set true to save in db after this if-else condition
	var checkForExistence= '{\''+unique_fieldStr +'\': \''+unique_fieldVal+'\'}';
	
	
		if (table_nameStr=='users' && typeof contentJson.password !== 'undefined' && contentJson.password !== null && contentJson.password != "") {
      		contentJson['password'] = passwordHash.generate(contentJson.password);
      	}
      	initFunctions.crudOpertions(db, table_nameStr, 'findOne', null, null, null, checkForExistence, function(result) {
			if (result.success=="OK") {
      			var document=result.aaData;
      			
      			if(mongoIDField!="" && mongoIDField!="undefined" && mongoIDField!=null){
      				initFunctions.returnFindOneByMongoID(db, table_nameStr, mongoIDField, function(existingDoc) {
      					if (existingDoc.aaData) {
      						var existingDocument=existingDoc.aaData;
      						if(existingDocument.created){
								contentJson["created"]=existingDocument.created;
							}else{
								contentJson['created']=initFunctions.currentTimestamp();
							}
      						var updateContentObj = new Object();
					 		/**for(var key in contentJson) {
					 			updateContentObj[key]=contentJson[key];
							}**/
							for(var key in contentJson) {
								if(contentJson[key]!="" && contentJson[key]!="null" && contentJson[key]!="undefined")	{
									var contentStr=contentJson[key].toString();
									if(contentStr.charAt(0)=="["){
										try{
        									updateContentObj[key]=JSON.parse(contentStr);
        								}
    									catch (error){
       										updateContentObj[key]=contentJson[key];
    									}
									}	else{
										updateContentObj[key]=contentJson[key];
									}
								}	else {
									updateContentObj[key]=contentJson[key];
								}		
							}
							db.collection(table_nameStr).update({_id:mongoIDField}, { $set: updateContentObj }, (err, result) => {
								if (err) {
    								link+="?error_msg=Error occurred while saving  please try after some time!";
								}
								if(editorFieldName!="" && editorFieldVal!=""){
    								link+="?"+editorFieldName+"="+editorFieldVal;
    							}
    							if(result){
    								link+="&success_msg=Saved successfully!";
    							}
    							res.redirect(link);
  							});
      					}else{
      						link+="?error_msg=This "+req.params.id+" already exists!"
      						res.redirect(link);
      					}
      				});
      			}	else	{
      				link+="?error_msg=The entry with same name already exists!"
      				res.redirect(link);
      			}
      		} else {
      			contentJson.created=initFunctions.currentTimestamp();
      			
      			initFunctions.returnFindOneByMongoID(db, table_nameStr, mongoIDField, function(existingDoc) {
      				if (existingDoc.aaData) {
      					var existingDocument=existingDoc.aaData;
      					if(existingDocument.created){
							contentJson["created"]=existingDocument.created;
						}else{
							contentJson['created']=initFunctions.currentTimestamp();
						}
      				
      					var updateContentObj = new Object();
					 		for(var key in contentJson) {
								var contentStr=contentJson[key].toString();
								if(contentStr.charAt(0)=="["){
									try{
        								updateContentObj[key]=JSON.parse(contentStr);
        							}
    								catch (error){
       									updateContentObj[key]=contentJson[key];
    								}
								}else{
									updateContentObj[key]=contentJson[key];
								}			
							}
					 
						db.collection(table_nameStr).update({_id:mongoIDField}, { $set: updateContentObj }, (err, result) => {
    						if (err) {
    							link+="?error_msg=Error occurred while saving, please try after some time!";
							}
							if(editorFieldName!="" && editorFieldVal!=""){
    							link+="?"+editorFieldName+"="+editorFieldVal;
    						}
    						if(result){
    							link+="&success_msg=Saved successfully!";
    						}
    						res.redirect(link)
  						});
      				}else{
      					db.collection(table_nameStr).save(contentJson, (err, result) => {
      						if (err) link+="?error_msg=Error occurred while saving, please try after some time!";
    						link+="?_id="+result["ops"][0]["_id"]+"&success_msg=Saved successfully!";
    						res.redirect(link)
  						});
      				}
      			});
      			
      		}
      	});
	
	}else{
		res.redirect('/sign-in');
	}
})

/** function : requireLogin (called in all api's for authentication)
authentication can be:
	-- based on cookie saved, cookieName is defined in init.js)
**/
function requireLogin (req, res, next) {
	// check for cookie in browser
	if(req.cookies[init.cookieName] != null && req.cookies[init.cookieName] != 'undefined' && req.cookies[init.cookieName]!=""){
		var session_id= req.cookies[init.cookieName];
   		authenticatedUser(session_id, function(userDetails) {
   			if(userDetails === null){
   				req.authenticationBool=false;
   				next();
   			}else{
   				req.authenticationBool=true;
				req.authenticatedUser = userDetails;
				next();
			}
		});
	}else{
		req.authenticationBool=false;
		next();
   	}
}

/**	function : authenticatedUser 
parameters : auth_session_id (current session id fetched from browser cookie), cb is callback/return parameter which contain logged in user's details
**/
var authenticatedUser =function (auth_session_id, cb) {
	if(auth_session_id != null && auth_session_id != 'undefined' && auth_session_id !=""){
		var mongoIDField= new mongodb.ObjectID(auth_session_id);
		//check for session with id find in cookie with active status
		initFunctions.returnFindOneByMongoID(db, 'sessions', mongoIDField, function(result) {
			if(result.error) {
				return cb(null);	
			}else if(result.aaData) {
				var session_result= result.aaData;
				if(session_result.status==true || session_result.status=="true"){
					//fetch user details from user unique id found in session output
					initFunctions.returnFindOneByMongoID(db, 'users', session_result.user_id, function(userDetails) {
						if(userDetails.error) return cb(null);
						if(userDetails.aaData){
							var returnUserDetsils=userDetails.aaData;
							returnUserDetsils['auth_id']=session_result._id;
							return cb(returnUserDetsils);
						}
					});
				}else{
					return cb(null);
				}
			}else{
				return cb(null);
			}
		});
   	}else{
   		return cb(null);
   	}
}
}