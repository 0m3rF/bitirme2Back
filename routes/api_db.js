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
	histString 	= config.historyCollection,
	songsString = config.songsCollection,
	recommendString = config.recommendCollection,
	sparkApiUrl = "http://78.167.253.212:5000";
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
					userid : docs.userid,
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
				console.log("\n\n" + JSON.stringify(docs) + "\n\n");
				res.json(info);
			}	
		});
	});
  		 

	router.post('/registerUser',(req,res)=>{

		var body = req.body;
		userModel = require("../models/user.js");

		console.log("\x1b[36mRegister isteği = " + JSON.stringify(req.body) + "\x1b[0m");
		
		if( !body.username  || !body.password || !body.email )
		{
			console.log(" *** Hatalı Kullanıcı Bilgileri ***");
			res.send({"register":"fail"})
			return;
		}
		db.collection(userString).findOne( {$or :[ {username : body.username} , { email : body.email} ] }, function (err,result) {
		    if (err) {  
		    	console.log("*** VERİTABANI HATASI **** = " + JSON.stringify(err));
		    	res.send({"register":"fail"}); 
		    	return;
		    }
		    if (result) {
		        res.send({"register":"fail"});
		    } 
		    else {
		    	db.collection(userString).find({}).sort({userid:-1}).limit(1).toArray((err,docs)=>{
		    		if(err)
		    		{
		    			console.log("Hata oluştu!");
		    			return;
		    		}

		    		userModel._id = new mongo.ObjectID();
		    		userModel.username = body.username;
					userModel.password = body.password;
					userModel.email = body.email;

					console.log("_id = " + userModel._id);
		    		if(docs)
		    		{
		    			userModel.userid = docs[0].userid+1;
		    		}
		    		else
		    		{
						userModel.userid = 26000;
		    		}
		    		
		    		db.collection(userString).insertOne(userModel,(err,result)=>{
		    			if(err)
		    			{
		    				console.log("hata = " + err)
		    				res.send({"register":"fail"});
		    				return;
		    			}
						console.log("Register isteği başarılı !Kaydedilen veri = " +  JSON.stringify(userModel)  );
						res.send({"register":"success"});
					});

		    	});

		    	
			}
		});
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
			}
	    });  
	});

	router.post('/search',authControlMiddleware,(req,res)=>{
		var search = req.query.q;
		console.log("Arama isteği =  "+ search);
		var obj =[];
		db.collection(songsString).find({"sarkiismi": {$regex : ".*"+search+".*"} })
		.limit(10).toArray((err,docs)=>{
			if(err)
			{
				console.log(err);
			}
			else if(docs)
			{
				

				for (var i = 0; i < docs.length; i++) {
					obj.push(docs[i]);
				}

			console.log(docs);
			}
			else
			{
				console.log("HatA?");
				return;
			}


			res.send(JSON.stringify(obj));
		});

	});

	router.post('/saveChanges',authControlMiddleware,(req,res)=>{
		var body = req.body;

		if(body.password != "")
		{
		
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
				res.send({'SAVE':'FAIL'});
			}
			else
			{
		    	res.send({"SAVE":"SUCCESS"});
			}
	    });
		}

		else
		{

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
				res.send({'SAVE':'FAIL'});
			}
			else
			{
		    	res.send({"SAVE":"SUCCESS"});
			}
	    }); 

		}

	});

	router.post('/deleteAccount',authControlMiddleware,(req,res)=>{
		var body = req.body;
		db.collection(userString).deleteOne({_id:mongo.ObjectID(body.id)},(err,result)=>{
			res.send({"DELETE":"SUCCESS"});

			//console.log(result);
		});
	});

	router.post('/addSongHistory',authControlMiddleware,(req,res)=>{
		var body = req.body;

		console.log(" history count  body = " + JSON.stringify(body));
		db.collection(histString).updateOne( { userid : body.userid, songid : body.songId },
			{ $set: {userid : body.userid, songid : body.songId, genreID : body.genreId},
			 $inc:{ rating : 1, time : 0 } },{upsert:true},(err,result)=>{
			res.send({"UPSERT":"SUCCESS"});

			//console.log(result);
		});
	});

	router.post('/addTimeToSongHistory',authControlMiddleware,(req,res)=>{
		var body = req.body;

		console.log(" history time  body = " + JSON.stringify(body));
		db.collection(histString).updateOne( 
			{ userid : body.userid, songid : body.songId },
			{ $set: {userid : body.userid, songid : body.songId, genreID : body.genreId},
			$inc:{rating: 0 ,time : 10 } },{upsert:true},(err,result)=>{
			res.send({"UPSERT":"SUCCESS"});

			//console.log(result);
		});
	});

	router.post('/minusTimeToSongHistory',authControlMiddleware,(req,res)=>{
		var body = req.body;

		console.log(" hisotry -time body = " + JSON.stringify(body));
		db.collection(histString).updateOne( { userid : body.userid, songid : body.songId },
			{ $set: {userid : body.userid, songid : body.songId, genreID : body.genreId},
			$inc:{rating: 0, time : -10 } },{upsert:true},(err,result)=>{
			res.send({"UPSERT":"SUCCESS"});

			//console.log(result);
		});
	});

	router.post('/playlistRecommendation',authControlMiddleware,(req,res)=>{
		var body = req.body;

		var obj = [];
		var rand = 0;

		console.log("Tip isteği = " + body.type);
		switch(body.type)
		{
			case 0: // en popüler x şarkı 



			request.get(
			    sparkApiUrl + '/playlistRecommendation?type=0&userid='+body.userid+'&ulkeid=1&yas=20',
			    function (error, response, body) {
			            if(body == "ok")
			            {
			            	console.log("Kayıt başarılı!");
			            	console.log(response);
			            	res.send(JSON.stringify(obj));
			            }
			    }

			);

				

			break;

			case 1: // kişiye özel öneri
			case 2:
			case 3:
			case 4:
			var url =  sparkApiUrl + '/playlistRecommendation?type='+body.type + '&userid=' +body.userid + "&ulkeid=" + body.country + "&yas=" + body.age;

			console.log("atılan istek = \n" + url);
			
			request.get(url,
			    function (error, response, resbody) {

			    	if(resbody != undefined)
			            if(resbody.includes("ok"))
			            {
			            	console.log("cevap geldi ");
						db.collection(recommendString).find({userid : body.userid, type: body.type}).toArray((err,docs)=>{
							console.log("bulunan şarkılar : ")
							console.log(docs);
						if(err)
						{
							console.log("DB hatası! : " + err);
							return;
						}
						
						var ids = [];

						for (var i = 0; i < docs.length; i++) {
							ids.push(docs[i].product);
						}

						db.collection(songsString).find({sarkiId : {$in : ids } }).toArray((err,sngs)=>{

							for (var i = 0; i < sngs.length; i++)
								obj.push(sngs[i]);
							
							console.log("kişiye özel gidecke = " + JSON.stringify(obj));
							res.send(JSON.stringify(obj));
						});

					});

			        }
			        else
			        	 {
			        	 	console.log("resbody = " + resbody);
			        	 	console.log("body = " + JSON.stringify(body));
			        	 	console.log("deneme ")
			        	 }
			    }

			);
			break;
		}


	});


	router.post('/playYoutubeSong',authControlMiddleware,(req,res)=>{
		var body = req.body;

		JSDOM.fromURL("https://www.youtube.com/results?search_query="+body.search, {}).then(dom => {
 
 			var searchid = dom.window.document.querySelector(".yt-lockup.yt-lockup-tile.yt-lockup-video.clearfix").getAttribute("data-context-item-id");
  			res.send({"id":searchid});

		});



	});

});



module.exports = router;