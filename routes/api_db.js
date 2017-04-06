var express 		= require('express');
var router 			= express.Router();
var MongoClient		= require('mongodb').MongoClient;

router.get("/", (req,res) => {
	res.send("This route will connect to db!");
});


router.get("/abc",(req,res)=>{
	res.send("abc route  /abc");
})


router.post('/registerNewUser',(req,res)=>{

	res.send("Hello!");
});

module.exports = router;