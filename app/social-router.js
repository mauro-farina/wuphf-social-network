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
    let getUserByUsername = await mongo.collection("users").findOne({username : req.params.username});
    if(getUserByUsername) {
        res.json(getUserByUsername);
    } else {
        res.send("user does not exist");
    }
});

router.get("/messages/:username", async (req, res) => { // Elenco dei messaggi dell’utente `username`
    const mongo = mongoManager.getDB();
    let messagesOfUser = await mongo.collection("messages").find({username : req.params.username},{sort: {messageID:-1}}).toArray();
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
    let messagesOfUser = await mongo.collection("messages").findOne(query);
    if(messagesOfUser) {
        res.json(messagesOfUser);
    } else {
        res.send("no messages");
    }
});

router.post("/messages", async (req, res) => { // Creazione di un nuovo messaggio da parte di cookie auth.username
    const auth_cookie = req.cookies.auth;
    if(!auth_cookie) {
        res.status(400).send("Not authenticated!");
    }
    let cookieUsername;
    jwt.verify(req.cookies.auth, process.env.JWT_SECRET_KEY, (err, decodedCookie) => {
        if(err) {
            res.status(400).send("Cookie cannot be verified");
        }
        cookieUsername = decodedCookie.username;
    });

    const mongo = mongoManager.getDB();
    let lastMessageOfUser = await mongo.collection("messages").findOne({username : cookieUsername},{ sort: {messageID: -1}});
    let newMessage = {
        messageID : 0,
        message : req.body.message,
        username : cookieUsername,
        date : new Date(),
        likedBy : []
    }

    if(lastMessageOfUser !== null) {
        newMessage.messageID = lastMessageOfUser.messageID+1;
    }
    await mongo.collection("messages").insertOne(newMessage);
    res.json(newMessage);
});

// so far _^_ it's all working

router.get("/followers/:username", async (req, res) => { // Lista dei followers dell’utente `username`
    const mongo = mongoManager.getDB();
    let followersOfUser = await mongo.collection("followers").findOne({username : req.params.username});
    res.json(followersOfUser);
});

router.post("/followers/:username", async (req, res) => { // Aggiunta di un nuovo follow per l’utente `username`
    // verify user is authenticated
    let auth_cookie_data;
    try {
        auth_cookie_data = jwt.verify(req.cookies.access_token, process.env.JWT_SECRET_KEY);
    } catch {
        res.status(400).send("Not authenticated!");
    }
    const mongo = mongoManager.getDB();
    // collection followers -> track new follow for :username
    let getFollowersOfUser = await mongo.collection("followers").findOne({username : req.params.username});
    if(getFollowersOfUser !== null) {
        let addNewFollower = await mongo.collection("followers")
            .updateOne( {username : req.params.username}, { $push: {followers: auth_cookie_data.username} } );
    } else {
        // error i guess
        res.status(500).send("error");
    }

    // collection feed -> track that cookie.username is now following :username (for the feed)
    let getFeedOfUser = await mongo.collection("feed").findOne({username : auth_cookie_data.username});
    if(getFeedOfUser !== null) {
        let addNewFollowToFeed = await mongo.collection("feed")
            .updateOne( {username : auth_cookie_data.username}, { $push: {followedUsers: req.params.username} } );
    } else {
        // error i guess
        res.status(500).send("error");
    }
    res.send("done");
});

router.delete("/followers/:username", (req, res) => { // Rimozione del follow all’utente `username`
    res.send("");
});

router.get("/feed", (req, res) => { // Elenco dei messaggi degli utenti seguiti
    res.send("feed");
});

router.post("/like/:idMessage", (req, res) => { // Like ad un messaggio con ID idMessage
    res.send("");
});

router.delete("/like/:idMessage", (req, res) => { // Rimozione like al messaggio con ID idMessage
    res.send("");
});

router.get("/search?q=query", (req, res) => { // Cerca l’utente che matcha la stringa query
    res.send("");
});

router.get("/whoami", (req, res) => { // Se autenticato, restituisce le informazioni sull’utente
    res.send("");
});


module.exports = router;