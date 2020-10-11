// server.js
// where your node app starts

// init project
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var shortid = require('shortid');

const Schema  = mongoose.Schema;

var app = express();
var db_uri = "mongodb+srv://Incomple_:Overspleen@trainingcluster.s2foa.mongodb.net/shorturlDB?retryWrites=true&w=majority"

let port = process.env.PORT||3000; //Good convention, since "process.env.PORT" will run correctly on heroku

/* Database */ 
mongoose.connect(db_uri, {useNewUrlParser: true, useUnifiedTopology: true });

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
const { generate } = require('shortid');
const { json } = require('body-parser');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

//logger middleware code from https://codesource.io/creating-a-logging-middleware-in-expressjs/
app.use(function (req, res, next) { 
  let current_datetime = new Date();
  let formatted_date =
    current_datetime.getFullYear() +
    "-" + 
    (current_datetime.getMonth() + 1) +
    "-" +
    current_datetime.getDate() +
    " " +
    current_datetime.getHours() +
    ":" +
    current_datetime.getMinutes() +
    ":" +
    current_datetime.getSeconds();
  let method = req.method;
  let url = req.url;
  let status = res.statusCode;
  let log = `[${method}:${url}] request received on ${formatted_date}. Status: ${status}`;
  console.log(log);
  next()
})
// The following 2 middleware is used if you want the form data to be available in req.body.
// I first started using this for the shorturl project, as I think it is specific to POST requests.
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});



// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  console.log("hello world")
  res.json({greeting: 'hello API'});
});

//Start of Timestamp API

app.get("/timestamp", function (req, res) {
  res.sendFile(__dirname + '/views/timestamp.html');
});

app.get("/api/timestamp/:date_string?", function (req, res) {
  //console.log(":datestring = " + req.params.date_string)
  //console.log("upon parsing: " + new Date(req.params.date_string))

  //console.log(typeof req.params.date_string)
  if (req.params.date_string == undefined) {
    //console.log("scenario 1")
    return res.json({"unix" : Date.parse(new Date()), "utc":(new Date().toUTCString())});
  }

  try {
    let dateInput = isNaN(Date.parse(req.params.date_string)) ? parseInt(req.params.date_string) : req.params.date_string;
    //console.log(new Date(dateInput).getTime());
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

//End of Timestamp API

//Start of Request Header Parser API
app.get("/requestheaderparser", function (req, res) {
  res.sendFile(__dirname + '/views/requestheaderparser.html');
});

app.get("/api/whoami", function (req, res) {
  return res.json({"ipaddress" : req.ip ,"language": req.headers["accept-language"],"software": req.headers["user-agent"]});
});

//End of Request Header Parser API

//Start of URL Shortener API

const ShortUrl = mongoose.model('ShortUrl', new Schema({ 
  original_url: String,
  short_url: String,
  suffix: String
 }));

app.get("/shorturl", function (req, res) {
  res.sendFile(__dirname + '/views/shorturl.html');
});

// from "https://www.geeksforgeeks.org/": The req.body property contains key-value 
// pairs of data submitted in the request body.
// By default, it is undefined and is populated when you use a middleware 
// called body-parsing such as express.urlencoded() or express.json().

app.post("/api/shorturl/new", function (req, res) {
  let userInput = req.body.inputURL;
  ShortUrl.findOne({original_url: userInput}).then(function(result) {
    //console.log("result = " + result)
    if (result == null) {
      let newShortId = shortid.generate();
      //console.log(__dirname);
      console.log(newShortId);
      //console.log(window.location); "window" not recognised
      // "newUrl" is a document created from the model "ShortUrl", which is created from a schema written several lines above
      let newUrl = new ShortUrl({
        original_url: userInput,
        short_url: "/api/shorturl/"+newShortId,
        suffix: newShortId
      })
      newUrl.save(function (err, data) {
        if (err) return console.log(err);
        console.log("Saved " + data + " to MongoDB")
      });
      //console.log("shorturl post request called. req.body: ");
      //console.log(req.body); "inputURL" is the value of the "name" attribute from the input element in shorturl.html
      return res.json({"original_url" : userInput ,"short_url": req.protocol + '://' + req.get('host') + req.originalUrl.slice(0,-3) + newShortId,"suffix": newShortId});
    }
    else{
      return res.json({"original_url" : result.original_url ,"short_url": req.protocol + '://' + req.get('host') + req.originalUrl.slice(0,-3) + result.suffix,"suffix": result.suffix});
    }
  });
});

app.get("/api/shorturl/:shortid", function(req, res) { //async required for await to work
  let idReq = req.params.shortid; 
  //console.log("idReq = " + idReq)
  ShortUrl.findOne({suffix: idReq}).then(function(result) {
    //console.log("result = " + result)
    if (result == null) {
      return res.json({"error":"No short URL found for the given input"});
    }
    else{
      res.redirect(result.original_url);
    }
  });
});
  


//End of URL Shortener API


// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
