	//basic init file
	var mongodbRe = require('mongodb')
	var MongoClient = mongodbRe.MongoClient;
	
	// Connection URL. This is where your mongodb server is running.
	var url = 'mongodb://neha:123456@ds163595.mlab.com:63595/library2';
	
	var _db;
	
	module.exports = {
    	mongodb : mongodbRe,
    	MongoClient : MongoClient,
    	mongoConnUrl : url,
    	port : 3000,
		cookieName : "library_login_id",
		system_name : "LibrarySystem",
		recipientStr : 'nehak189@gmail.com'
	};