const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // https://www.npmjs.com/package/bcryptjs
// written in pure JS => no compilation problems using docker (but it is 30% slower)
require("dotenv").config({ path: './private/settings.env' });
const mongoManager = require("./mongodb-manager.js");

// Joi to validate inputs
// SANITIZER express-validator

/*
POST    /api/auth/signup    Registrazione di un nuovo utente
POST    /api/auth/signin    Login di un utente
*/

router.post("/signup", async (req, res) => { // https://vegibit.com/node-js-mongodb-user-registration/
    const mongo = mongoManager.getDB();
    //express.json() should parse req.body from String to JSON if content-type = app/json
    //app.use(express-json()) HAS TO BE BEFORE app.use(this-file);
    if(req.body == undefined) {
        return res.status(400).send("Make sure Content-Type is application/json in the HTTP POST Request");
    }
    if(req.body.username == undefined || req.body.password == undefined) {
        return res.status(400).send("Missing information");
    }
    let alreadyExistingUserQuery = await mongo.collection("users").findOne({username: req.body.username});
    if(alreadyExistingUserQuery) {
        return res.status(400).send(`Username ${req.body.username} is already taken!`);
    }
    
    let newUser = { 
        username : req.body.username,
        password : req.body.password,
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        bio : req.body.bio,
    };
    
    // salt rounds: value for quick testing 2, value for good security 10+
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS_FOR_SALT));
    newUser.password = await bcrypt.hash(newUser.password, salt);
    
    //await mongo.collection("users").insertOne(newUser);
    res.json(newUser);
    /*
    const token = jwt.sign({ id: 7, name: "test-jwt-cookie" }, process.env.JWT_SECRET_KEY, (err,token) => {
        res.cookie("logged_in", token, {httpOnly: true,}).status(200).json({token,});
    });
    */
});

router.post("/signin", async (req, res) => {
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
        res.send("Welcome in buddy");
    } else {
        return res.status(400).send(`Invalid password or username`);
    }
    //res.send(jwt.verify(req.cookies.access_token, "SECRET_KEY"));
});

module.exports = router;