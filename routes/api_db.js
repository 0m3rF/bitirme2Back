var express 	= require('express'),
	router 		= express.Router(),
	MongoClient	= require('mongodb').MongoClient,
	mongo 		= require('mongodb'),
	assert 		= require('assert'),
	jwt			= require("jsonwebtoken"),
	userModel 	= require("../models/user.js")
	config 		= require('../models/config.js'),
	mongoString = config.url,
	userString 	= config.userCollection,
	histString 	= config.historyCollection;
const secret = "bubirgizlianahtardıroldukcauzunolmasıbizimicinonemlidirsonradegistiririz";

var request = require('request'),
    jsdom = require('jsdom');

const { JSDOM } = jsdom;


MongoClient.connect(mongoString,(err,db)=>{

	assert.equal(null,err);
	console.log("Veritabanı bağlantısı başarılı!");


	router.get("/", (req,res) => {

		res.send("This route will connect to db!");
	});



	router.post("/loginUser",(req,res)=>{

		var body = req.body;
		console.log("\x1b[36mLogin isteği = " + JSON.stringify(req.body) + "\x1b[0m");
		db.collection(userString).find({username:body.username,password:body.password})
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


		var userChecker = db.collection(userString).findOne({$or :[ {username : body.username} , { email : body.email} ] })

		if(userChecker)
		{
			res.send({"register":"fail"});
			return;
		}


		userModel.username = body.username;
		userModel.password = body.password;
		userModel.email = body.email;



		db.collection(userString).insertOne(userModel,(err,result)=>{
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
					console.log("auth Control! failed!" );
					res.send({"AUTH" : "fail"});
				}else{
					console.log("Auth control passed! \n Token = " )
					next();
				}
			})
		} else {
			console.log("auth Control! failed!" );
			res.send( {"AUTH" : "fail"} );
		}

		
	};

	router.post('/saveUserInfo',authControlMiddleware ,(req,res)=>{
		var body = req.body;
		console.log("welcome ! gelen cevap = " + JSON.stringify(body));

		db.collection(userString).updateOne({ username : body.username }, 
		{ 
		$set: { 
				age : body.age ,
				country : body.country,
				firstTime : false,
				favSongId : body.favSongId,
				favGenreId : body.favGenreId,
				historySongId : body.historySongId
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
		obj.push(songs[2]);

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

	router.post('/saveChanges',authControlMiddleware,(req,res)=>{
		var body = req.body;

		if(body.password != "")
		{
			console.log("password var!");
		
		db.collection(userString).updateOne({ _id : new mongo.ObjectID(body.id)}, 
		{ 
		$set: { 
				password : body.password,
				age : body.age ,
				country : body.country,
				email : body.email,
			} 
		},
		(err, result) => {
			if(err)
			{
				console.log("Gelen body = " + JSON.stringify(req.body));
				res.send({'SAVE':'FAIL'});
			}
			else
			{
		    	res.send({"SAVE":"SUCCESS"});
		    	console.log("kayıt başarlılı = " + JSON.stringify(result));
			}
	    });
		}

		else
		{
			console.log("password yok!");

		db.collection(userString).updateOne({ _id : new mongo.ObjectID(body.id)}, 
		{ 
		$set: { 
				age : body.age ,
				country : body.country,
				email : body.email,
			} 
		},
		(err, result) => {
			if(err)
			{
				console.log("Gelen body = " + JSON.stringify(req.body));
				res.send({'SAVE':'FAIL'});
			}
			else
			{
		    	res.send({"SAVE":"SUCCESS"});
		    	console.log("kayıt başarlılı = " + JSON.stringify(result));
			}
	    }); 

		}

		console.log("Gelen body = " + JSON.stringify(req.body));
	});

	router.post('/deleteAccount',authControlMiddleware,(req,res)=>{
		var body = req.body;

		console.log("gelen silme isteği body = " + JSON.stringify(body));
		db.collection(userString).deleteOne({_id:mongo.ObjectID(body.id)},(err,result)=>{
			res.send({"DELETE":"SUCCESS"});

			//console.log(result);
		});
	});

	router.post('/addSongHistory',authControlMiddleware,(req,res)=>{
		var body = req.body;

		console.log("gelen hisotry isteği body = " + JSON.stringify(body));
		db.collection(histString).updateOne( { userId : body.id, songId : body.songId },{ $set: {userId : body.id, songId : body.songId, genreId : body.genreId}, $inc:{ count : 1, time : 0 } },{upsert:true},(err,result)=>{
			res.send({"UPSERT":"SUCCESS"});

			//console.log(result);
		});
	});

	router.post('/addTimeToSongHistory',authControlMiddleware,(req,res)=>{
		var body = req.body;

		console.log("gelen hisotry isteği body = " + JSON.stringify(body));
		db.collection(histString).updateOne( { userId : body.id, songId : body.songId },{ $set: {userId : body.id, songId : body.songId, genreId : body.genreId},$inc:{count: 0 ,time : 10 } },{upsert:true},(err,result)=>{
			res.send({"UPSERT":"SUCCESS"});

			//console.log(result);
		});
	});

	router.post('/minusTimeToSongHistory',authControlMiddleware,(req,res)=>{
		var body = req.body;

		console.log("gelen hisotry isteği body = " + JSON.stringify(body));
		db.collection(histString).updateOne( { userId : body.id, songId : body.songId },{ $set: {userId : body.id, songId : body.songId, genreId : body.genreId},$inc:{count: 0, time : -10 } },{upsert:true},(err,result)=>{
			res.send({"UPSERT":"SUCCESS"});

			//console.log(result);
		});
	});

	router.post('/playlistRecommendation',authControlMiddleware,(req,res)=>{
		var body = req.body;

		console.log("gelen playlist isteği body = " + JSON.stringify(body));
		var obj = [];
		var rand = 0;
		switch(req.body.type)
		{
			case 0: // en popüler x şarkı 
			rand = Math.floor(Math.random()*7);
				obj.push(songs[rand]);
			rand = Math.floor(Math.random()*7);
				obj.push(songs[rand]);
			rand = Math.floor(Math.random()*7);
				obj.push(songs[rand]);
			break;

			case 1: // kişiye özel öneri
			rand = Math.floor(Math.random()*7);
				obj.push(songs[rand]);
			rand = Math.floor(Math.random()*7);
				obj.push(songs[rand]);
			rand = Math.floor(Math.random()*7);
				obj.push(songs[rand]);
			break;

			case 2:  // her türe göre özel öneri ( her türün en sevileni gibi...)
			rand = Math.floor(Math.random()*7);
				obj.push(songs[rand]);
			rand = Math.floor(Math.random()*7);
				obj.push(songs[rand]);
			rand = Math.floor(Math.random()*7);
				obj.push(songs[rand]);
			break;

			case 3: // ülkeye göre özel öneri
			rand = Math.floor(Math.random()*7);
			console.log("rand = " + rand);
				obj.push(songs[rand]);
			rand = Math.floor(Math.random()*7);
			console.log("rand = " + rand);
				obj.push(songs[rand]);
			rand = Math.floor(Math.random()*7);
			console.log("rand = " + rand);
				obj.push(songs[rand]);
			break;

			case 4: // yaş gruplarına göre özel öneri
			rand = Math.floor(Math.random()*7);
				obj.push(songs[rand]);
			rand = Math.floor(Math.random()*7);
				obj.push(songs[rand]);
			rand = Math.floor(Math.random()*7);
				obj.push(songs[rand]);
			break;
		}

		console.log("göndirelecek mzükler = " + JSON.stringify(obj));
		res.send(JSON.stringify(obj));


	});


	router.post('/playYoutubeSong',authControlMiddleware,(req,res)=>{
		var body = req.body;

		JSDOM.fromURL("https://www.youtube.com/results?search_query="+body.search, {}).then(dom => {
  
 			console.log("arama isteği = " + body.search);
 			var searchid = dom.window.document.querySelector(".yt-lockup.yt-lockup-tile.yt-lockup-video.clearfix").getAttribute("data-context-item-id");

  			res.send({"id":searchid});
		  console.log("giden id = " + searchid );
		});



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

