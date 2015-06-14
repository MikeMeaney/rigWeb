//rigWeb: An Express based web application for
//the administration of Cold Pressor Testing Rigs
//Written by Mike Meaney in San Diego, CA (2015)

//Data is taken in via the Query String in HTTP GET requests.
//Granted this isn't the BEST way of doing this, and Express can
//do more, but the issue is that rig client is based off Processing.
//And Processing sucks, but man-alive, does it have a reliable UART
//Library. It's HTTP stuff blows.

//This branch adds the ability to bind Rig clients to the server

//The Bare bones of it
var express = require('express'); //Our humble Hero...
var app = express(); // ...has arrived...
var mongoose = require('mongoose'); // ... along with his noble Side-kick!
var bodyParser = require('body-parser'); // Decoes HTTP data from body (if needed)

//Bring in all the Schemas needed for the DB
var Rig = require('./models/rig');
var RigData = require('./models/rigData');

//Configure App settings
app.use(bodyParser.json()); // support JSON bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

//Connect to and Define the database
mongoose.connect('mongodb://localhost/rigWeb'); //Connect
var db = mongoose.connection; // Declare
db.on('error', function(callback){
  console.error.bind(console, 'connection error:');
});

db.once('open', function(callback){
  console.log('YAY! MONGO DB CONNECTION MADE!!')
})


// ------ ROUTE ALL THE THINGS!! ----------------------------------

//This is the Root level directory, not sure what to do with it yet
app.get('/', function (req, res) {
  console.log("Request @ /");
  res.send('Hello World!');
});

//The rigs status route for getting state and sub-state data
app.get('/status', function(req, res){
   console.log("------ GET req @ " + req.path +" ------" )
   // console.log("theStruggle: " + req.query.theStruggle); //Used for proof...
   // console.log("derpNumber is: " + req.query.derpNumber) //...of concept.
   console.log(req.query);
   res.json("Prameters = " + req.query);
});

//The Route for saving data to the Server's Mongo DB 
app.get('/data', function(req,res){
  console.log("------ GET req @ " + req.path +" ------" )
  console.log(req.query);

  //Save to Mongo DB
  var newRigData = RigData({
    RigID : req.query.rig,
    Data: {
      durration : req.query.durration,
      timeIn : req.query.inTime,
      timeOut : "Just now",
    }
  })

  newRigData.save(function(err){
    if(err) throw err;

    console.log('newRigData Saved!');
    //res.send({"saved" : true});
  });

  res.send({"requestComplete":true});
});
// --------------ALL THE THINGS HAVE BEEN ROUTED! ---------------------

//Start listening and print out where that's happening
var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('rigWeb is listening at http://%s:%s', host, port);

});