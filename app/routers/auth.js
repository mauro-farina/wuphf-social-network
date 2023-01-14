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
    .matches(/^[a-zA-Z0-9._-]+$/g).withMessage("Valid characters for the username are alphanumerical characters, hyphens '-', underscores '_' and dots '.'")
    .isLength({max:25}).withMessage("Username cannot be more than 25 characters")
    .escape(),
  body('password', "Password must be at least 8 characters").isLength({ min: 8 }).escape(),
  body('firstName')
    .trim()
    .matches(/^[a-zA-Z0-9' ]*$/g).withMessage("Valid characters for the first name are alphanumerical characters and single quotes '")
    .escape(),
  body('lastName')
    .trim()
    .matches(/^[a-zA-Z0-9' ]*$/g).withMessage("Valid characters for the last name are alphanumerical characters and single quotes '")
    .escape(),
  body('bio').trim().escape()
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
                        "value": "panda84", "msg": "Password must be at least 8 characters", "param": "password", "location": "body"
                       } ] */
	}
    if(req.body == undefined) {
        return res.status(400).json({error : "Content-Type in the HTTP POST Request has to be application/json"});
    }
    
    const mongo = mongoManager.getDB();

    const usernameRegex = new RegExp(["^", req.body.username, "$"].join(""), "i");
    try{
        let alreadyExistingUserQuery = await mongo.collection("users").findOne({username: usernameRegex});
        if(alreadyExistingUserQuery) {
            return res.status(400).json( { error : `Username ${alreadyExistingUserQuery.username} is already taken` } );
        }
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }

    let newUser = {
        username : req.body.username,
        password : req.body.password,
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        bio : req.body.bio,
        signUpDate : new Date()
    };
    try{
        // salt rounds: 10+ for good security
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS_FOR_SALT));
        newUser.password = await bcrypt.hash(newUser.password, salt);
    
        await mongo.collection("users").insertOne(newUser);
        await mongo.collection("follows")
                .insertOne( { 
                    username : req.body.username, 
                    followers : [], 
                    followedUsers : []
                } );
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }

    jwt.sign({ username: req.body.username }, process.env.JWT_SECRET_KEY, { expiresIn: "14d"}, (err,token) => {
        if(err){
            console.log(`Something went wrong: ${err}`);
            return res.status(500).json({error : "Server error"});
        }
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 14);
        delete newUser._id;
        return res
                .cookie("auth", token, {httpOnly: true, expires: expDate })
                .json({newUser});
    });

});


router.post("/signin", sanitizeInputSignin, async (req, res) => {
    console.log("signin");
    const sanitizeInputErrors = validationResult(req);
	if (!sanitizeInputErrors.isEmpty()) {
        return res.status(400).json({ error : sanitizeInputErrors.array()[0].msg });
	}

    if(req.body == undefined) {
        return res.status(400).json({error : "Content-Type in the HTTP POST Request has to be application/json"});
    }
    console.log("pre check guud");

    const mongo = mongoManager.getDB();

    console.log("got db");


    const usernameRegex = new RegExp(["^", req.body.username, "$"].join(""), "i");
    let alreadyExistingUserQuery;
    try {
        alreadyExistingUserQuery = await mongo.collection("users").findOne({username: usernameRegex});
        if(!alreadyExistingUserQuery) {
            return res.status(400).json( { error : `Invalid username or password` } );
        }
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }

    console.log("past exist query");


    try {
        const compareResult = await bcrypt.compare(req.body.password, alreadyExistingUserQuery.password);
        console.log("compared");

        if(compareResult) {
            console.log("it went well");

            jwt.sign({ username: alreadyExistingUserQuery.username }, process.env.JWT_SECRET_KEY, { expiresIn: "14d"}, (err,token) => {
                if(err) {
                    console.log(err);
                    return res.status(500).json({error : "Server error"});
                }
                console.log("now we return");
                const expDate = new Date();
                expDate.setDate(expDate.getDate() + 14);
                return res
                        .cookie("auth", token, {httpOnly: true, expires: expDate})
                        .json({username: alreadyExistingUserQuery.username, authenticated : true});
            });
        } else {
            return res.status(400).json( { error : `Invalid username or password` } );
        }
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
});


router.get("/signoff", (req, res) => {
    res.status(200).clearCookie('auth').send();
});

module.exports = router;