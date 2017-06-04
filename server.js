var express 	= require('express');
var cors 		= require('cors'); // HTTP access control (CORS) 
var bodyParser 	= require('body-parser'); // For json objects with post
var app 		= express();  // Initialize express
var port 		= process.env.PORT || 3000 ; // whatever is in the environment variable PORT, or 3000 if there's nothing there.
var api_db 		= require("./routes/api_db"); // db route which we generated.
var cors 		= require("cors");

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); //  exposes it on req.body as something easier to interface with 
app.use(function(req, res, next) { // This method controls accept a request or not.
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    next();
});

app.use('/api/db',api_db); // If some request comes to xyz.com/api/db this will route that req to api_db file

app.get('/',(req,res)=>{
	res.send("Nothing to see here, move on...");
});

app.get('/api',(req,res)=>{ // this will handle coming get request to xyz.com/api
	res.send("Welcome to API with get!"); // send response.
});

app.post('/api',(req,res)=>{ // this will handle coming post request to xyz.com/api
	res.send("Welcome to API with post!");
});




var server = app.listen(port, () => console.log("App started to listen port = " + port ) );// start server

server.timeout = 100000;

