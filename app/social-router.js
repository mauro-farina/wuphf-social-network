const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // https://www.npmjs.com/package/bcryptjs
// written in pure JS => no compilation problems using docker (but it is 30% slower)
require("dotenv").config({ path: './private/settings.env' });
const mongoManager = require("./mongodb-manager.js");
const { body, validationResult } = require('express-validator');

/*
GET     /api/social/users/:id                   Visualizzazione informazione dell’utente con ID id
GET     /api/social/messages/:userId            Elenco dei messaggi dell’utente con ID userID
GET     /api/social/messages/:userId/:idMsg     Singolo messaggio dell’utente userID con ID idMsg
POST    /api/social/messages                    Creazione di un nuovo messaggio
GET     /api/social/followers/:id               Lista dei followers dell’utente con ID id
POST    /api/social/followers/:id               Aggiunta di un nuovo follow per l’utente id
DELETE  /api/social/followers/:id               Rimozione del follow all’utente id
GET     /api/social/feed                        Elenco dei messaggi degli utenti seguiti
POST    /api/social/like/:idMessage             Like ad un messaggio con ID idMessage
DELETE  /api/social/like/:idMessage             Rimozione like al messaggio con ID idMessage
GET     /api/social/search?q=query              Cerca l’utente che matcha la stringa query
GET     /api/social/whoami                      Se autenticato, restituisce le informazioni sull’utente 
*/

router.get("/users/:username", async (req, res) => { // Visualizzazione informazioni dell’utente `username`
    const mongo = mongoManager.getDB();
    // projection
    let getUserByUsername = await mongo.collection("users").findOne({username : req.params.username});
    if(getUserByUsername) {
        res.json(getUserByUsername);
    } else {
        res.send("user does not exist");
    }
});

router.get("/messages/:username", async (req, res) => { // Elenco dei messaggi dell’utente `username`
    const mongo = mongoManager.getDB();
    const queryOptions = {
        sort : {
            messageID : -1
        },
        projection : {
            _id : 0,
            messageID : 1,
            message : 1,
            username : 1,
            date : 1,
            likedBy : 1
        }
    }
    let messagesOfUser = await mongo.collection("messages").find({username : req.params.username}, queryOptions).toArray();
    if(messagesOfUser){
        res.json(messagesOfUser);
    } else {
        res.send("no messages");
    }
});

router.get("/messages/:username/:messageID", async (req, res) => { // Singolo messaggio dell’utente `username` con ID messageID
    const mongo = mongoManager.getDB();
    const query = {
        username : req.params.username, 
        messageID : parseInt(req.params.messageID)
    }
    const queryOptions = {
        projection : {
            _id : 0,
            messageID : 1,
            message : 1,
            username : 1,
            date : 1,
            likedBy : 1
        }
    }
    let messagesOfUser = await mongo.collection("messages").findOne(query, queryOptions);
    if(messagesOfUser) {
        res.json(messagesOfUser);
    } else {
        res.send("no messages");
    }
});

router.post("/messages", async (req, res) => { // Creazione di un nuovo messaggio da parte di cookie auth.username
    const auth_cookie = req.cookies.auth;
    if(!auth_cookie) {
        return res.status(400).send("Not authenticated!");
    }
    let cookieUsername;
    jwt.verify(req.cookies.auth, process.env.JWT_SECRET_KEY, (err, decodedCookie) => {
        if(err) {
            return res.status(400).send("Cookie cannot be verified");
        }
        cookieUsername = decodedCookie.username;
    });

    console.log(cookieUsername);
    const mongo = mongoManager.getDB();
    let lastMessageOfUser = await mongo.collection("messages").findOne({username : cookieUsername},{ sort: {messageID: -1}});
    let msgID = lastMessageOfUser !== null ? lastMessageOfUser.messageID+1 : 0;
    let newMessage = {
        messageID : msgID,
        message : req.body.message,
        username : cookieUsername,
        date : new Date(),
        likedBy : []
    }

    await mongo.collection("messages").insertOne(newMessage);
    res.json(newMessage); // _id is sent as well ._.
});

router.get("/followers/:username", async (req, res) => { // Lista dei followers dell’utente `username`
    const mongo = mongoManager.getDB();
    const queryOptions = {
        projection : {
            _id : 0,
            username : 1,
            followers : 1
        }
    }
    let followersOfUser = await mongo.collection("follows").findOne({username : req.params.username}, queryOptions);
    if(followersOfUser){
        res.json(followersOfUser);
    } else {
        res.send("no followers");
    }
});


router.post("/followers/:username", async (req, res) => {   // Aggiunta di un nuovo follow per l’utente `:username`
    const auth_cookie = req.cookies.auth;                   // interpreted as: "req.cookies.auth starts following `:username`"
    if(!auth_cookie) {
        return res.status(400).send("Not authenticated!");
        //res.redirect();
    }
    let cookieUsername;
    jwt.verify(req.cookies.auth, process.env.JWT_SECRET_KEY, (err, decodedCookie) => {
        if(err) {
            return res.status(400).send("Cookie cannot be verified"); // how should i handle this case?
            //res.redirect(); // ?
        }
        cookieUsername = decodedCookie.username;
    });

    if(cookieUsername === req.params.username) { // is === the best here?
        return res.status(400).send("One cannot follow themselves");
    }

    const mongo = mongoManager.getDB();

    // check if "is already following"
    
    let getFollowersOfParamsUser = await mongo.collection("follows").findOne({username : req.params.username});
    if(getFollowersOfParamsUser !== null) {
        await mongo.collection("follows") // `:username` has a new follower: cookieUsername
            .updateOne( {username : req.params.username}, { $push: {followers: cookieUsername} } );
        
    } else {
        // weird error i guess, should not happen but you never know
        // maybe should be handled like: .insertOne(...)
        return res.status(500).send("error");
    }

    let getFollowedUsersOfCookieUser = await mongo.collection("follows").findOne({username : cookieUsername});
    if(getFollowedUsersOfCookieUser !== null) {
        await mongo.collection("follows") // cookieUsername now follows :username
            .updateOne( {username : cookieUsername}, { $push: {followedUsers: req.params.username} } );
    } else {
        // weird error i guess, should not happen but you never know
        // maybe should be handled like: .insertOne(...)
        return res.status(500).send("error");
    }
    res.status(200).json({
        username : req.params.username,
        newFollower : cookieUsername
    });
});

router.delete("/followers/:username", async (req, res) => { // Rimozione del follow all’utente `username`
    const auth_cookie = req.cookies.auth;                   // interpreted as: "req.cookies.auth stops following `:username`"
    if(!auth_cookie) {
        return res.status(400).send("Not authenticated!");
        //res.redirect();
    }
    let cookieUsername;
    jwt.verify(req.cookies.auth, process.env.JWT_SECRET_KEY, (err, decodedCookie) => {
        if(err) {
            return res.status(400).send("Cookie cannot be verified"); // how should i handle this case?
            //res.redirect(); // ?
        }
        cookieUsername = decodedCookie.username;
    });

    if(cookieUsername === req.params.username) { // is === the best here?
        return res.status(400).send("One cannot follow themselves");
    }

    const mongo = mongoManager.getDB();

    // check if "is not even following"
    
    let getFollowersOfParamsUser = await mongo.collection("follows").findOne({username : req.params.username});
    if(getFollowersOfParamsUser !== null) {
        await mongo.collection("follows") // `:username` loses a follower: cookieUsername
            .updateOne( {username : req.params.username}, { $pull: {followers: cookieUsername} } );
    } 
    let getFollowedUsersOfCookieUser = await mongo.collection("follows").findOne({username : cookieUsername});
    if(getFollowedUsersOfCookieUser !== null) {
        await mongo.collection("follows") // cookieUsername stops following :username
            .updateOne( {username : cookieUsername}, { $pull: {followedUsers: req.params.username} } );
    }
    
    res.send("probably done");
});


// -=-=-=-=-=-=-=-=-=-=-=-=-= so far _^_ it's all working -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


router.get("/feed", async (req, res) => { // Elenco dei messaggi degli utenti seguiti
    res.send("feed");
});

router.post("/like/:idMessage", async (req, res) => { // Like ad un messaggio con ID idMessage
    res.send("");
});

router.delete("/like/:idMessage", async (req, res) => { // Rimozione like al messaggio con ID idMessage
    res.send("");
});

router.get("/search?q=query", async (req, res) => { // Cerca l’utente che matcha la stringa query
    res.send("");
});

router.get("/whoami", async (req, res) => { // Se autenticato, restituisce le informazioni sull’utente
    res.send("");
});

module.exports = router;