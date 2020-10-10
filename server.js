// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
let port = process.env.PORT||3000;

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  console.log("hello world")
  res.json({greeting: 'hello API'});
});

app.get("/api/timestamp/:date_string?", function (req, res) {
  console.log(":datestring = " + req.params.date_string)
  //console.log("upon parsing: " + new Date(req.params.date_string))

  console.log(typeof req.params.date_string)
  if (req.params.date_string == undefined) {
    console.log("scenario 1")
    return res.json({"unix" : Date.parse(new Date()), "utc":(new Date().toUTCString())});
  }

  try {
    let dateInput = isNaN(Date.parse(req.params.date_string)) ? parseInt(req.params.date_string) : req.params.date_string;
    console.log(new Date(dateInput).getTime());
    if (isNaN(new Date(dateInput))) {
      return res.json({"error" : "Invalid Date" });
    }
    return res.json({"unix" : new Date(dateInput).getTime(), "utc":(new Date(dateInput).toUTCString())});
  }
  catch(err){
    console.log("Caught an error: " + err.message);
    return res.json({"error" : "Invalid Date" });
  }
    
   
});



// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
