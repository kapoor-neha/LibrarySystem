	/**********************************************************************
	*  server.js initiate the app
	**/
	
'use strict';
/**
 * Module dependencies.
 */
var init = require('./config/init');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */
 
// Init the express application
var app = require('./config/express')(init);

// Start the app by listening on <port>
app.listen(init.port);

//db connection
var db;
init.MongoClient.connect(init.mongoConnUrl, function (err, database) {
	db=database;
  	if (err) {
    	console.log('Unable to connect to the mongoDB server. Error:', err);
  	} else {
   		console.log('Connection established to', init.mongoConnUrl);
   		require('./controller/routes')(init, app,db);
  	}
});

// Logging initialization
console.log('Library system application started on port ' + init.port);