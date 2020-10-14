// server.js
// where your node app starts

// init project
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser'); //for shorturl
var shortid = require('shortid'); //for shorturl
var multer  = require('multer'); //for file metadata
var fs = require('fs'); //for file metadata 

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
// I first started using this for the shorturl project. I think it is specific to POST requests.

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

//**********Start of Timestamp API**********

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

//**********End of Timestamp API**********

//**********Start of Request Header Parser API**********
app.get("/requestheaderparser", function (req, res) {
  res.sendFile(__dirname + '/views/requestheaderparser.html');
});

app.get("/api/whoami", function (req, res) {
  return res.json({"ipaddress" : req.ip ,"language": req.headers["accept-language"],"software": req.headers["user-agent"]});
});

//**********End of Request Header Parser API**********

//**********Start of URL Shortener API**********

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
// By default, it is undefined and is populated when you use a body-parser middleware
// such as app.use(bodyParser.urlencoded({ extended: false })) or app.use(bodyParser.json()).

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
  
//**********End of URL Shortener API**********

//**********Start of File Metadata Microservice API**********

var upload = multer({ dest: 'uploads/' });

app.get("/fileanalyse", function (req, res) {
  res.sendFile(__dirname + '/views/fileanalyse.html');
});

// variable in upload.single('') must have the same value as the 'name' attribute in the file input element in the html file
app.post("/fileanalyse/api/fileanalyse", upload.single('upfile'),function (req, res) {
  fs.unlink(__dirname + '/uploads/' + req.file.filename, function(err) { //deletes uploaded file to save space
    if (err) throw err;
    console.log('deleted ' + req.file.filename );
  });
  return res.json({"name":req.file.originalname,"type":req.file.mimetype,"size":req.file.size})
});

//**********End of File Metadata Microservice API**********

//**********Start of Exercise Tracker API**********
/*
const exerciseSchema = new Schema({ 
  desciption: String,
  duration: Number,
  date: {type: Date, default: Date.now()}
});
*/
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fr", "Sat"];

const Profile = mongoose.model('Profile', new Schema({ 
  user_name: String,
  log: [{ 
    _id:false,
    desciption: String,
    duration: Number,
    date: {type: String, default: new Date().toDateString()}
  }]
}));
//date: {type: String, default: `${days[new Date().getDay()]} ${months[new Date().getMonth()]} ${days[new Date().getDate()]} ${days[new Date().getFullYear()]}`}
app.get("/exercise", function (req, res) {
  res.sendFile(__dirname + '/views/exercise.html');
});

//.lean() returns POJOs (plain old javascript objects)
app.get("/exercise/api/exercise/users", function (req, res) {
  Profile.find().select("-log").lean().then((result) => {
    return res.send(result);
  });

});


app.post("/exercise/api/exercise/new-user", (req, res) => {
  let userInput = req.body.username;
  Profile.findOne({user_name: userInput}).then((result) => {
    console.log("result = " + result)
    if (result == null) {
      let newUser = new Profile({
        user_name: userInput,
      })
      newUser.save( (err, data) => {
        if (err) return console.log(err);
        console.log("Saved " + data + " to MongoDB")
      });
      //console.log("shorturl post request called. req.body: ");
      //console.log(req.body); "inputURL" is the value of the "name" attribute from the input element in shorturl.html
      return res.json({"username" : newUser.user_name ,"_id": newUser._id});
    }
    else{
      return res.send("Username already taken");
    }
  });
});

app.post("/exercise/api/exercise/add", (req, res) => {
  let inputId = req.body.userId;
  let inputDescription = req.body.description;
  let inputDuration = parseFloat(req.body.duration);
  let inputDate = (req.body.date) == "" ? new Date() : new Date(req.body.date);
  console.log(inputDate)
  Profile.findOne({_id: inputId}).then((result) => {
    //console.log("result = " + result)
    if (result == null) {
      return res.send("User not found");
    }
    else if (inputDescription == "" || isNaN(inputDuration) || isNaN(inputDate)) {
      return res.send("Fields not completed properly");
    }
    else{
      let newLog = {
        desciption: inputDescription,
        duration: inputDuration,
        date: inputDate.toDateString()
        //date: `${days[inputDate.getDay()]} ${months[inputDate.getMonth()]} ${inputDate.getDate()} ${inputDate.getFullYear()}`
      }
      result.log.push(newLog);
      result.save( (err, data) => {
        if (err) return console.log(err);
        console.log("Saved " + data + " to MongoDB")
      });
      return res.json({"_id" : result._id ,"username": result.user_name,"date":newLog.date,"duration":newLog.duration,"description":newLog.desciption}); 
    }
  });
});

app.get("/exercise/api/exercise/log", function (req, res) {
  let inputId = req.query.userId;
  let fromDate = new Date (req.query.from);
  let toDate = new Date (req.query.to);
  let responseJson = {};

  if (mongoose.Types.ObjectId.isValid(inputId)) {
    Profile.findById(inputId).then((result) => { //bugs out if inputId is not in an mongoose id object format, hence requiring a (mongoose.Types.ObjectId.isValid(inputId)) check first
      //console.log("result = " + result)
      //console.log(fromDate)
      if (result == null) {
        return res.send("User not found");
      }
      else {
        responseJson._id = result._id;
        responseJson.username = result.user_name;
        //let filteredResult = result;
        //console.log(result);
        let resultLog = result.log
        if (isNaN(fromDate) == false && isNaN(toDate) == false) {
          responseJson.from = fromDate.toDateString();
          responseJson.to = toDate.toDateString();
          resultLog = result.log.filter((entry) => {
            //console.log(entry);
            return new Date(entry.date) >= fromDate && new Date(entry.date) <= toDate;
          });
        }
        else if (isNaN(fromDate) == false && isNaN(toDate) == true) {
          responseJson.from = fromDate.toDateString();
          resultLog = result.log.filter((entry) => {
            //console.log(entry.date >= fromDate);
            return new Date(entry.date) >= fromDate;
          });
        }
        else if (isNaN(fromDate) == true && isNaN(toDate) == false) {
          responseJson.to = toDate.toDateString();
          resultLog = result.log.filter((entry) => {
            //console.log(entry.date >= fromDate);
            //console.log(entry);
            return new Date(entry.date) <= toDate;
          });
        }
        /*
        let newDateArray = resultLog.map((entry) => entry.date.toDateString());
        //console.log(resultLog);
        for (i in resultLog) {
          resultLog[i].date = newDateArray[i];
          //console.log(resultLog[i].date);
        }
        
        for (i in resultLog) {
          console.log(typeof resultLog);
          //console.log(resultLog[i].date.toDateString());
          let dateStr = resultLog[i].date.toDateString();
          resultLog[i].date = 0;
        }
        */
        //console.log(resultLog);
        result.log = resultLog;
        let limit = (req.query.limit == "" ? result.log.length : req.query.limit);//If limit is empty, limit = length of log
        result.log.splice(0,result.log.length - limit);//if limit empty, removes nothing, else remove everything - limit
        //console.log(`fromDate = ${fromDate}, req.query.from = ${req.query.from}`)
        responseJson.count = result.log.length;
        responseJson.log = result.log;
        return res.send(responseJson);
      }
    }); //To do: Date stuff 
  }
  else {
    return res.send("Invalid userId");
  }
  
});

//**********End of Exercise Tracker API**********


// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
