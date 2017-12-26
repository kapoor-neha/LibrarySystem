'use strict';
/**
 * Module dependencies.
 */
var init = require('./config/init');
var passwordHash = require('password-hash');
var initFunctions = require('./config/functions');	
/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

//db connection
var db;
init.MongoClient.connect(init.mongoConnUrl, function (err, database) {
	db=database;
  	if (err) {
    	console.log('Unable to connect to the mongoDB server. Error:', err);
  	} else {
   		console.log('Connection established to', init.mongoConnUrl);
   				var tempPassword = "admin";
				var hashPasswordStr=passwordHash.generate(tempPassword);
   				db.collection("users").save({"username" : "admin", "firstname" : "Web", "lastname" : "master", "email" : "nehak189@gmail.com", "password" : hashPasswordStr,  "access_right" : "11", "status" : "1", "created" : initFunctions.currentTimestamp()}, (err, result) => {
      				if (err) console.log(err);
      				if(result){
      					console.log("Created admin user successfully with username : admin and password : "+tempPassword);
    				}
  				});
  				
  	}
});
