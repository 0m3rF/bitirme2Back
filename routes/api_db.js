var express 	= require('express'),
	router 		= express.Router(),
	MongoClient	= require('mongodb').MongoClient,
	assert 		= require('assert'),
	jwt			= require("jsonwebtoken"),
	userModel 	= require("../models/user.js")
	config 		= require('../models/config.js'),
	mongoString = config.url
	clcString 	= config.userCollection;

const secret = "bubirgizlianahtardıroldukcauzunolmasıbizimicinonemlidirsonradegistiririz";


MongoClient.connect(mongoString,(err,db)=>{

	assert.equal(null,err);
	console.log("Veritabanı bağlantısı başarılı!");


	router.get("/", (req,res) => {

		res.send("This route will connect to db!");
	});



	router.post("/loginUser",(req,res)=>{

		var body = req.body;
		console.log("\x1b[36mLogin isteği = " + JSON.stringify(req.body) + "\x1b[0m");
		db.collection(clcString).find({username:body.username,password:body.password})
		.toArray((err,docs)=>{

			if(err || docs.length <= 0)
				res.send({"LOGIN":"fail"});
			else{
				var user = {
					username : body.username,
					email: 	docs.email,				
					sayi: 10
				}
				var token = jwt.sign(user,secret, { expiresIn:3600 } );
				docs = docs[0];
				var info = { 
					_id : docs._id,
					username:docs.username,
					email:docs.email,
					age : docs.age,
					country: docs.country,
					isFirstTime: docs.firstTime,
					favSongId : docs.favSongId,
					favGenreId : docs.favGenreId,
					historySongId: docs.historySongId,
					LOGIN:"success",
					token:token
				}

				console.log("Gönderilen cevap = " + JSON.stringify(info));
				res.json(info);

			}
			
		});

	});
  		 

	router.post('/registerUser',(req,res)=>{

		var body = req.body;

		if(body.username == "" || body.password == "" || body.email == "")
		{
			res.send({"register":"fail"})
			return;
		}

		userModel.username = body.username;
		userModel.password = body.password;
		userModel.email = body.email;



		db.collection(clcString).insertOne(userModel,(err,result)=>{
			assert.equal(err,null);

			console.log("Register isteği başarılı !Kaydedilen veri = " +  JSON.stringify(userModel)  );

			// result callback function eğer istenirse bir başka fonksyion çağıralabilir.

		});

		res.send({"register":"success"});
	});


//************************* Yetkilendirme Gereken işlemler! ******************************* //

	var authControlMiddleware = (req,res,next)=>{ // token kontrolü için
		var token = req.body.token || req.headers['token'];

		if(token)
		{
			jwt.verify(token,secret,(err,decode)=>{
				if(err){
					console.log("auth Control! failed!" + token);
					res.send({"AUTH" : "fail"});
				}else{
					console.log("Auth control passed! \n Token = " + token)
					next();
				}
			})
		} else {
			console.log("auth Control! failed!" + token);
			res.send( {"AUTH" : "fail"} );
		}

		
	};

	router.post('/saveUserInfo',authControlMiddleware ,(req,res)=>{
		var body = req.body;
		console.log("welcome ! gelen cevap = " + JSON.stringify(body));

		db.collection(clcString).updateOne({ username : body.username }, 
		{ 
		$set: { 
				age : body.age ,
				country : body.country,
				firstTime : false,
				favSongId : body.favSongs,
				favGenreId : body.favGenres
			} 
		},
		(err, result) => {
			if(err)
				res.send({'SAVE':'FAIL'});
			else
			{
		    	res.send({"SAVE":"success"});
		    	console.log("kayıt başarlılı = " + JSON.stringify(result));
			}
	    });  
	});

	router.post('/search',authControlMiddleware,(req,res)=>{
		var search = req.query.q;

		var obj =[];
		obj.push(songs[0]);
		obj.push(songs[1]);

		if(!search)
		{
			console.log(" ilk iki şarkı =  "+ JSON.stringify(obj));
			res.send(JSON.stringify(obj));
		}
		else
		{
			obj =[];
			console.log("Arama isteği =  "+ search);
			for(var i =0 ; i < songs.length ; i++)
			{

				if(songs[i].sarkiismi.toUpperCase().includes(search.toUpperCase()))
					obj.push(songs[i]);
			}
			console.log("Songs =  "   + JSON.stringify(obj) );
			res.send(JSON.stringify(obj));
		}


	});

});



module.exports = router;



var songs = [
  {
    "sarkiId":"SOBARPM12A8C133DFF", 
    "sarkiismi":"(Looking For) The Heart Of Saturday", 
    "sanatciIsmi":"Shawn Colvin", 
    "genreId":15
  }, 
  {
    "sarkiId" : "SOEYRFT12AB018936C", 
    "sarkiismi":"2 Da Beat Ch'yall", 
    "sanatciIsmi":"Kris Kross", 
    "genreId":16
  }, 
  {
    "sarkiId":"SOQQESG12A58A7AA28", 
    "sarkiismi":"Cold Beer feat. Prince Metropolitan", 
    "sanatciIsmi":"Danny Diablo", 
    "genreId":15
  }, 
  {
    "sarkiId":"SOKOVRQ12A8C142811", 
    "sarkiismi":"Ethos of Coercion", 
    "sanatciIsmi":"Dying Fetus", 
    "genreId":15
  }, 
  {
    "sarkiId":"SOGTUKN12AB017F4F1", 
    "sarkiismi":"No One Could Ever", 
    "sanatciIsmi":"Hudson Mohawke", 
    "genreId":8
  }, 
  {
    "sarkiId":"SOMPVQB12A8C1379BB", 
    "sarkiismi":"Pilots", 
    "sanatciIsmi":"Tiger Lou", 
    "genreId":15
  }, 
  {
    "sarkiId":"SOBNYVR12A8C13558C", 
    "sarkiismi":"Si Vos Quer\u00e9s", 
    "sanatciIsmi":"Yerba Brava", 
    "genreId":11
  }
];

