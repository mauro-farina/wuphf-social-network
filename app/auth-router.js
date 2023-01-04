const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // https://www.npmjs.com/package/bcryptjs
// written in pure JS => no compilation problems using docker (but it is 30% slower)
require("dotenv").config({ path: './private/settings.env' });
const mongoManager = require("./mongodb-manager.js");
const { body, validationResult } = require('express-validator');

// Joi to validate inputs
// SANITIZER express-validator

/*
POST    /api/auth/signup    Registrazione di un nuovo utente
POST    /api/auth/signin    Login di un utente
*/

const sanitizeInput = [
  body('username')
    .notEmpty().withMessage("Username must be at least 1 character")
    .not().matches(' ').withMessage("Username cannot contain spaces")
    .escape(),
  body('password', "Password must be at least 8 characters").isLength({ min: 8 })
];

router.post("/signup", sanitizeInput, async (req, res) => {
    const sanitizeInputErrors = validationResult(req);
	if (!sanitizeInputErrors.isEmpty()) {
        //return res.status(400).json({ inputValidationErrors : sanitizeInputErrors.array() });
        return res.status(400).json({ error : sanitizeInputErrors.array()[0].msg });
        /*
        "errors": [
            {
                "value": "panda84",
                "msg": "Password must be at least 8 characters",
                "param": "password",
                "location": "body"
            }
        ]
        */
	}
    const mongo = mongoManager.getDB();

    //app.use(express-json()) HAS TO BE BEFORE app.use(this-file);
    if(req.body == undefined) {
        return res.status(400).send("Make sure Content-Type is application/json in the HTTP POST Request"); //json?
    }
    /*
    // express-validator takes care of this bit
    if(req.body.username == undefined) {
        return res.status(400).json({ "error" : "username field cannot be left empty" });
    }
    if(req.body.password == undefined) {
        return res.status(400).json({ "error" : "password field cannot be left empty" });
    }
    */
    // TRY-CATCHES FOR MONGO AND BCRYPT OPERATIONS ?
    let alreadyExistingUserQuery = await mongo.collection("users").findOne({username: req.body.username}); // to lower case? idk
    if(alreadyExistingUserQuery) {
        return res.status(400).json( { error : `Username ${req.body.username} is already taken` } );
    }
    //let lastUserQuery = await mongo.collection("users").findOne({},{ sort: {"userID": -1}});

    let newUser = {
        //userID : 0,
        username : req.body.username,
        password : req.body.password,
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        bio : req.body.bio,
        signUpDate : new Date()
    };
    
    /*
    if(lastUserQuery !== null) {
        newUser.userID = lastUserQuery.userID+1;
    }
    */
    
    // salt rounds: value for quick testing 2, value for good security 10+
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS_FOR_SALT));
    newUser.password = await bcrypt.hash(newUser.password, salt);

    await mongo.collection("users").insertOne(newUser);
    await mongo.collection("follows")
            .insertOne( { 
                username : req.body.username, 
                followers : [], 
                followedUsers : []
            } );

    //const token = await jwt.sign( {username : req.body.username}, process.env.JWT_SECRET_KEY);
    jwt.sign({ username: req.body.username }, process.env.JWT_SECRET_KEY, { expiresIn: "30d"}, (err,token) => {
        res.cookie("auth", token, {httpOnly: true}); //expires in 30d
        res.status(200).json( {newUser, token } );
    });
    /*
    const token = jwt.sign({ id: 7, name: "test-jwt-cookie" }, process.env.JWT_SECRET_KEY, (err,token) => {
        res.cookie("logged_in", token, {httpOnly: true,}).status(200).json({token,});
    });
    */
});

router.post("/signin", sanitizeInput, async (req, res) => {
    const sanitizeInputErrors = validationResult(req);
	if (!sanitizeInputErrors.isEmpty()) {
        return res.status(400).json({ errors: sanitizeInputErrors.array() });
    }
    const mongo = mongoManager.getDB();
    if(req.body == undefined) {
        return res.status(400).send("Make sure Content-Type is application/json in the HTTP POST Request");
    }
    if(req.body.username == undefined || req.body.password == undefined) {
        return res.status(400).send("Missing information");
    }
    
    let alreadyExistingUserQuery = await mongo.collection("users").findOne({username: req.body.username});
    if(!alreadyExistingUserQuery) {
        return res.status(400).send(`Invalid password or username`);
    }

    const compareResult = await bcrypt.compare(req.body.password, alreadyExistingUserQuery.password);
    if(compareResult) {
        jwt.sign({ username: req.body.username }, process.env.JWT_SECRET_KEY, { expiresIn: "30d"}, (err,token) => {
            res.cookie("auth", token, {httpOnly: true}); //expires in 30d
            res.status(200).json( { token } );
        });
    } else {
        return res.status(400).send(`Invalid password or username`);
    }
    //res.send(jwt.verify(req.cookies.access_token, "SECRET_KEY"));
});

module.exports = router;