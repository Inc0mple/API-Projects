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
  console.log("upon parsing: " + Date.parse(req.params.date_string))
  //console.log(req)
  if (req.params.date_string == undefined) {
    console.log("scenario 1")
    return res.json({"unix" : Date.parse(new Date()), "utc":(new Date().toUTCString())});
  }
  else if (isNaN(Date.parse(req.params.date_string))) {
    console.log("scenario 2")
    return res.json({"error" : "Invalid Date" });
  }
  else {
    console.log("scenario 3")
    return res.json({"unix" : Date.parse(req.params.date_string), "utc":(new Date(req.params.date_string).toUTCString())});
  } 
});



// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
