const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // https://www.npmjs.com/package/bcryptjs
// written in pure JS => no compilation problems using docker (but it is 30% slower)
require("dotenv").config({ path: './private/settings.env' });
const mongoManager = require("../mongodb-manager.js");
const { body, validationResult } = require('express-validator');

// Joi to validate inputs
// SANITIZER express-validator

/*
POST    /api/auth/signup    Registrazione di un nuovo utente
POST    /api/auth/signin    Login di un utente
*/

const sanitizeInputSignup = [
  body('username')
    .notEmpty().withMessage("Username field is empty")
    .not().matches(' ').withMessage("Username cannot contain spaces")
    .escape(),
  body('password', "Password must be at least 8 characters").isLength({ min: 8 }).escape(),
  body('firstName').escape(),
  body('lastName').escape(),
  body('bio').escape()
];

const sanitizeInputSignin = [
    body('username').not().isEmpty().withMessage("Username field is empty").trim().escape(),
    body('password').not().isEmpty().withMessage("Password field is empty").escape()
  ];

router.post("/signup", sanitizeInputSignup, async (req, res) => {
    const sanitizeInputErrors = validationResult(req);
	if (!sanitizeInputErrors.isEmpty()) {
        //return res.status(400).json({ inputValidationErrors : sanitizeInputErrors.array() });
        return res.status(400).json({ error : sanitizeInputErrors.array()[0].msg });
        /* "errors": [ {
                        "value": "panda84",
                        "msg": "Password must be at least 8 characters",
                        "param": "password",
                        "location": "body"
                       } ] */
	}
    
    if(req.body == undefined) {
        return res.status(400).send("Make sure Content-Type is application/json in the HTTP POST Request"); //json?
    }
    
    const mongo = mongoManager.getDB();

    // TRY-CATCHES FOR MONGO AND BCRYPT OPERATIONS ?
    let alreadyExistingUserQuery = await mongo.collection("users").findOne({username: req.body.username}); // to lower case? idk
    if(alreadyExistingUserQuery) {
        return res.status(400).json( { error : `Username ${req.body.username} is already taken` } );
    }

    let newUser = {
        //userID : 0,
        username : req.body.username,
        password : req.body.password,
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        bio : req.body.bio,
        signUpDate : new Date()
    };
    
    //let lastUserQuery = await mongo.collection("users").findOne({},{ sort: {"userID": -1}});
    //if(lastUserQuery !== null) {
    //    newUser.userID = lastUserQuery.userID+1;
    //}
    
    // salt rounds: 2 for quick testing, 10+ for good security 
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS_FOR_SALT)); // BCRYPT_ROUNDS_FOR_SALT ignored for some reason
    newUser.password = await bcrypt.hash(newUser.password, salt);

    await mongo.collection("users").insertOne(newUser);
    await mongo.collection("follows")
            .insertOne( { 
                username : req.body.username, 
                followers : [], 
                followedUsers : []
            } );

    jwt.sign({ username: req.body.username }, process.env.JWT_SECRET_KEY, { expiresIn: "30d"}, (err,token) => {
        return res.cookie("auth", token, {httpOnly: true}).redirect("/home");
    });

});

router.post("/signin", sanitizeInputSignin, async (req, res) => {
    const sanitizeInputErrors = validationResult(req);
	if (!sanitizeInputErrors.isEmpty()) {
        return res.status(400).json({ error : sanitizeInputErrors.array()[0].msg });
	}

    if(req.body == undefined) {
        return res.status(400).send("Make sure Content-Type is application/json in the HTTP POST Request"); //json?
    }
    
    const mongo = mongoManager.getDB();
    
    let alreadyExistingUserQuery = await mongo.collection("users").findOne({username: req.body.username});
    if(!alreadyExistingUserQuery) {
        return res.status(400).json( { error : `Invalid username or password` } );
    }

    const compareResult = await bcrypt.compare(req.body.password, alreadyExistingUserQuery.password);
    if(compareResult) {
        jwt.sign({ username: req.body.username }, process.env.JWT_SECRET_KEY, { expiresIn: "30d"}, (err,token) => {
            return res.cookie("auth", token, {httpOnly: true}).redirect("/home");
        });
    } else {
        return res.status(400).json( { error : `Invalid username or password` } );
    }
});

module.exports = router;