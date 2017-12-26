	/**********************************************************************
	*  functions.js contain all the functions required for requests, which will be called in the main file
	**/
	
	var init = require('./init');
	var mongodb=init.mongodb;
	
var self = module.exports = 
{
	/** to fetch one record depending upon table/collection name, search_id(mongo id) **/
	returnFindOneByMongoID : function (db, collectionName, search_id, cb){
		var outputObj = new Object();
		if(search_id!="" && search_id!="undefined" && search_id!=null){
			db.collection(collectionName).findOne({_id: new mongodb.ObjectID(search_id)}, function(err, document_details) {
				if (err) {
					outputObj["error"]   = err;
					cb(outputObj);
      			} else if (document_details) {
      				outputObj["aaData"]   = document_details;
      				cb(outputObj);
     			}	else	{
     				outputObj["error"]   = "Sorry, no record found!";
					cb(outputObj);
     			}
     		});
		}else{
			outputObj["error"]   = "Invalid id passed";
			cb(outputObj);
		}
	},
	/**crud function to find one, update, insert and delete records
	parameters : db(database connection), collectionStr(table name), actionStr(action passed), postContent(data to be saved), 
	uniqueFieldNameStr (unique field name), uniqueFieldNameStr
	**/
	crudOpertions: function(db, collectionStr, actionStr, postContent, uniqueFieldNameStr, uniqueFieldValueStr, checkForExistenceStr, cb){
		var outputObj = new Object();
		
		for(var key in postContent) {
			var contentStr=postContent[key];
			if(typeof(contentStr)=="string")	{
				if(contentStr.charAt(0)=="["){
					try{
        				postContent[key]=JSON.parse(contentStr);
        			}
    				catch (error){
       					postContent[key]=contentStr;
    				}
				}	
			}else{
				postContent[key]=contentStr;
			}		
		}
		if (typeof checkForExistenceStr !== 'undefined' && checkForExistenceStr != "null" && checkForExistenceStr !== null && checkForExistenceStr!=""){
			var checkForExistenceObj=checkForExistenceStr;
		}else if((uniqueFieldNameStr!="" && uniqueFieldValueStr!="") || (uniqueFieldNameStr!=null && uniqueFieldValueStr!=null)){
			var checkForExistenceObj= {};
			checkForExistenceObj[uniqueFieldNameStr]= uniqueFieldValueStr;
			if(postContent && (postContent!=="" || postContent!==null) && (postContent['uuid_system'] && postContent['uuid_system']!= "")){
				var checkForExistenceObj = {};
				checkForExistenceObj[uniqueFieldNameStr]=uniqueFieldValueStr;
				checkForExistenceObj["uuid_system"]=postContent['uuid_system'];
			}
		}
		
		if(checkForExistenceObj!="" && checkForExistenceObj!=null){
			if(postContent!="" && postContent!=null){
				postContent.modified=self.currentTimestamp();
			}
			if(typeof(checkForExistenceObj)=="array" || typeof(checkForExistenceObj)=="object"){
				var findStr=checkForExistenceObj;
			}else{
				eval('var findStr='+checkForExistenceObj);
			}			
			switch (actionStr) {
    			case 'findOne':
        			db.collection(collectionStr).findOne(findStr, function(searchErr, document) {
        				if (searchErr) {
							outputObj["error"]   = searchErr;
							cb(outputObj);
      					} else if(document){
      						outputObj["success"] = "OK";
      						outputObj["aaData"] = document;
      						cb(outputObj);
      					}else{
      						outputObj["error"]   = "No results found!";
							cb(outputObj);
      					}
					});
        			break;
        		case 'create':
        			db.collection(collectionStr).findOne(findStr, function(searchErr, document) {
        				if (searchErr) {
        					outputObj["error"]   = "Error occurred while saving ["+searchErr+"], please try after some time!";
							cb(outputObj);
      					}else if(document){
      						outputObj["error"] = "This "+uniqueFieldValueStr+" already exists!"
      						cb(outputObj);
      					}else{
      						postContent.created=self.currentTimestamp();
      						postContent.uuid=self.guid();
      						db.collection(collectionStr).save(postContent, (err4, result) => {
      							if (err4) outputObj["error"]  = "Error occurred while saving ["+err4+"], please try after some time!";
    							outputObj["success"]  = "Saved successfully!";
    							if(result && result["ops"][0]["_id"]){
    								outputObj["_id"]  = result["ops"][0]["_id"];
    							}
    							cb(outputObj);
  							});
      					}
					});
        			break;
    			case 'update':
    				db.collection(collectionStr).findOne(findStr, function(searchErr, document) {
        				if(document){
        					if(document.created){
								postContent["created"]=document.Created;
							}else{
								postContent['created']=self.currentTimestamp();
							}
							if(document.uuid){
								postContent["uuid"]=document.uuid;
							}else{
								postContent['uuid']=self.guid();
							}
      						db.collection(collectionStr).update(findStr, postContent, (err1	, result) => {
    							if (err1) outputObj["error"]="Error occurred while updating ["+err1+"], please try after some time!";
    							outputObj["success"]= "Updated successfully!";
    							cb(outputObj);
  							});
						}else{
							outputObj["error"]   = "Error occurred while updating ["+searchErr+"], please try after some time!";
							cb(outputObj);
						}
					});
       				break;
       			case 'delete':
       				db.collection(collectionStr).findOne(findStr, function(searchErr, document) {
       					if(document){
							db.collection(collectionStr).remove(findStr, function(err, result){
    							if (err) outputObj["error"]="Error occurred while deleting ["+err+"], please try after some time!";
    							outputObj["success"]="Deleted successfully!";
    							cb(outputObj);
  							});
						}else {
							outputObj["error"]   = "Error occurred while deleting, please try after some time!";
							cb(outputObj);
						}
					});
       				break;
    			default:
        			outputObj["error"]   = "Please specify the action!";
					cb(outputObj);
			}
		}else if(actionStr=='create'){
			postContent.created=self.currentTimestamp();
			postContent.uuid=self.guid();
      		db.collection(collectionStr).save(postContent, (err4, result) => {
      			if (err4) outputObj["error"]  = "Error occurred while saving ["+err4+"], please try after some time!";
    			outputObj["success"]  = "Saved successfully!";
    			outputObj["_id"]  = result["ops"][0]["_id"];
    			cb(outputObj);
  			});
      	}else{
			outputObj["error"]   = "Please specify unique field name and its value!";
			cb(outputObj);
		}
	},
	
	saveSessionBeforeLogin : function(db, user_id, systems_access, cb){
		var outputObj = new Object();
		db.collection('sessions').save({"user_id": new mongodb.ObjectID(user_id), "status" : true, "active_system_uuid" : new mongodb.ObjectID(systems_access)}, (err, result) => {
			if (result){
				db.collection('systems').find({}).count(function (e, count) {
					outputObj["cookie"]   = result["ops"][0]["_id"];	// set the cokkie
      				outputObj["success"]   = 'OK';
      				outputObj["link"]   = '/index';
      				
      				cb(outputObj);
     			});
      		}else{
      			outputObj["error"]   = 'no';
      			cb(outputObj);
    		}
  		});
	},
	// return the current timestamp
	currentTimestamp : function (){
		var timeStampStr=Math.round(new Date().getTime()/1000)
		return timeStampStr;
	},
	//generate a 36 character unique id
	guid : function () {
  		function s4() {
    		return Math.floor((1 + Math.random()) * 0x10000)
      		.toString(16)
      		.substring(1);
  		}
  		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	}
};