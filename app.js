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
var express = require('express'); //Our humble hero...
var app = express(); // ...has arrived...
var mongoose = require('mongoose'); // ... along with his noble side-kick!
var bodyParser = require('body-parser'); // Decodes HTTP data from body (if needed)

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

//This is the Root level directory. Where the home page is loaded
app.get('/', function (req, res) {
  console.log("Request @ /");
  res.send('Rigley Server is up and Running!');
});


//The Route for saving data to the Server's Mongo DB 
app.get('/data', function(req,res){
  console.log("------ GET req @ " + req.path +" ------" )
  console.log(req.query);
  if(req.query.rig != undefined){
  //Check to see if that Rig is registered
  Rig.findOne({'ID': req.query.rig}, 'ID' ,function(err, rig){
     if (err) return handleError(err);
    if(rig != null){
      console.log("Found :" + rig.ID)
    }
    else{
      console.log("nope,"+req.query.rig+" was not found");
      console.log("+++ ADDING, "+req.query.rig+" TO DB +++");
      //Create new Rig Object
      var newRig = Rig({
        ID : req.query.rig,
        CurrentPID : '',
        State : 'Registered'
      });
      //Save it to the DB
      newRig.save(function(err){
        if(err) throw err;
        console.log('I cristen thee Rig, '+ newRig.ID);
      });
    }
  });
  //Get the current PID of the targeted Rig
  Rig.findOne({ID : req.query.rig}, function(err, doc){
    console.log("------ Fart -----------");
    console.log(doc.CurrentPID);
    var thePID = doc.CurrentPID;

    //Save to Mongo DB
  var newRigData = RigData({
    RigID : req.query.rig,
    PID : thePID,
    Data: {
      durration : req.query.durration,
      timeIn : req.query.inTime,
      timeOut : req.query.outTime,
    }
  });

  newRigData.save(function(err){
    if(err) throw err;

    console.log('newRigData Saved!');
    //Clear the PID and set state to waiting
    doc.State = "Waiting";
    doc.CurrentPID = "";
    doc.save();
  });

  })

 }
  res.send({"requestComplete":true});
});

//This is the RigView route. Anything that needs to be pused to the
//test subject gets routed through this
app.get('/RigView', function(req, res){
  res.header('Access-Control-Allow-Origin', '*');
  console.log("------ GET req @ " + req.path +" ------" )
  console.log(req.query);
  console.log("This might be a PID:" + req.query.PID);
  console.log("Set for Rig: " + req.query.rig);

  //Update the currentPID for that Rig and set it as ready
  Rig.findOne({ID : req.query.rig}, function(err,doc){
    if(err) throw err;
    doc.CurrentPID = req.query.PID;
    doc.State = "Ready";
    doc.save();
    console.log(doc);
  });
  res.send("Updated CurrentPID")

  //Clear the currentPID after the test
});

//The rigs status route for getting state and sub-state data
app.get('/status', function(req, res){
   res.header('Access-Control-Allow-Origin', '*');
   console.log("------ GET req @ " + req.path +" ------" )
  
   console.log(req.query);
    //if no query is given then just send out all the rigs
    Rig.find({}).exec(function(err,docs){
      if(err) res.send(err); // Send out the error
      res.json(docs); //otherwise send all the rigs
      //console.log(docs); //
    });
    //If the query containts data about a rig and it's state do this
    if(req.query.rig != undefined && req.query.state != undefined){
      console.log("By Jobe, there's a Rig ID there! " + req.query.rig);
      console.log("And it has the state of: " + req.query.state);

      //Find the rig and update it' state
      Rig.findOne({ID:req.query.rig}, function(err,doc){
        if(err) res.send(err);
        doc.State = req.query.state;
        doc.save();
      });
    }


    
  
});

// --------------ALL THE THINGS HAVE BEEN ROUTED! ---------------------

//Start listening and print out where that's happening
var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('rigWeb is listening at http://%s:%s', host, port);

});