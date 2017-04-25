var express 	= require('express'),
	router 		= express.Router(),
	MongoClient	= require('mongodb').MongoClient,
	assert 		= require('assert'),
	dbConfig 	= require('../models/dbConfig.js'),
	mongoString = dbConfig.url,
	jwt			= require("jsonwebtoken");


const secret = "bubirgizlianahtardıroldukcauzunolmasıbizimicinonemlidirsonradegistiririz";


MongoClient.connect(mongoString,(err,db)=>{

	assert.equal(null,err);
	console.log("Veritabanı bağlantısı başarılı!");


	router.get("/", (req,res) => {

		res.send("This route will connect to db!");
	});



	router.post("/loginUser",(req,res)=>{

		var body = req.body;

		db.collection('user_test').find({username:body.username,password:body.password})
		.toArray((err,docs)=>{
			
			if(err || docs.length <= 0)
				res.send({"LOGIN":"fail"});
			else{
				console.log("Kullanıcı bulundu! : "+ JSON.stringify(docs));
				var user = {
					username : body.username,
					email: 	docs.email,
					sayi: 10
				}
				var token = jwt.sign(user,secret, { expiresIn:4 } );

				var response = {
					username:body.username,
					LOGIN:"success",
					token:token,
					isFirstTime:true
				}

				res.json(response);

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


		db.collection('user_test').insertOne({username:body.username,password:body.password,email:body.email},(err,result)=>{
			assert.equal(err,null);

			console.log("Register isteği başarılı !Kaydedilen veri = " +  JSON.stringify(req.body)  );

			// result callback function eğer istenirse bir başka fonksyion çağıralabilir.

		});

		res.send({"register":"success"});
	});


});



module.exports = router;