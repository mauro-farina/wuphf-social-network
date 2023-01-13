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
    const usernameRegex = new RegExp(["^", req.body.username, "$"].join(""), "i");
    let alreadyExistingUserQuery = await mongo.collection("users").findOne({username: usernameRegex});
    if(alreadyExistingUserQuery) {
        return res.status(400).json( { error : `Username ${alreadyExistingUserQuery.username} is already taken` } );
    }

    let newUser = {
        username : req.body.username,
        password : req.body.password,
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        bio : req.body.bio,
        signUpDate : new Date()
    };
    
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

    jwt.sign({ username: req.body.username }, process.env.JWT_SECRET_KEY, { expiresIn: "14d"}, (err,token) => {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 14);
        return res.cookie("auth", token, {httpOnly: true, expires: expDate }).redirect("/#/feed");
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

    const usernameRegex = new RegExp(["^", req.body.username, "$"].join(""), "i");
    let alreadyExistingUserQuery = await mongo.collection("users").findOne({username: usernameRegex});
    if(!alreadyExistingUserQuery) {
        return res.status(400).json( { error : `Invalid username or password` } );
    }

    const compareResult = await bcrypt.compare(req.body.password, alreadyExistingUserQuery.password);
    if(compareResult) {
        jwt.sign({ username: alreadyExistingUserQuery.username }, process.env.JWT_SECRET_KEY, { expiresIn: "14d"}, (err,token) => {
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + 14);
            return res.cookie("auth", token, {httpOnly: true, expires: expDate}).redirect("/#/feed");
        });
    } else {
        return res.status(400).json( { error : `Invalid username or password` } );
    }
});


router.get("/signoff", async (req, res) => {
    res.status(200).clearCookie('auth').send();
});

module.exports = router;