const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
require("dotenv").config({ path: './private/settings.env' });
const mongoManager = require("./mongodb-manager.js");

// Joi to validate inputs
// something to sanitize inputs! REMEMBER TO DO

/*
POST    /api/auth/signup    Registrazione di un nuovo utente
POST    /api/auth/signin    Login di un utente
*/

router.get("/signup", async (req, res) => { // https://vegibit.com/node-js-mongodb-user-registration/
    const mongo = mongoManager.getDB();
    const credentials = req.body; //express.json() should parse from String to JSON if content-type = app/json
    if(req.body.username == undefined || req.body.password == undefined) {
        return res.status(400).send("Missing information");
    }
    let alreadyExistingUserQuery = await mongo.collection("users").findOne({username: req.body.username});
    if(alreadyExistingUserQuery) {
        return res.status(400).send("Username already taken!");
    }
    const salt = await bcrypt.genSalt(); // no need to store it: https://stackoverflow.com/a/64457340
    // BCRYPT_ROUNDS_FOR_SALT may become an environment varible
    // default value 10, value for quick testing 1, value for good security 15+
    let newUser = { 
        username : req.body.username,
        password : req.body.password,
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        bio : req.body.bio,
        }
    newUser.password = await bcrypt.hash(newUser.password, salt);
    await mongo.collection("users").insertOne(newUser);
    /*
    const token = jwt.sign({ id: 7, name: "test-jwt-cookie" }, process.env.JWT_SECRET_KEY, (err,token) => {
        res.cookie("logged_in", token, {httpOnly: true,}).status(200).json({token,});
    });
    */
});

router.get("/signin", (req, res) => {
    res.send(jwt.verify(req.cookies.access_token, "SECRET_KEY"));
});

module.exports = router;