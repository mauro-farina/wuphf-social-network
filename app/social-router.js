const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // https://www.npmjs.com/package/bcryptjs
// written in pure JS => no compilation problems using docker (but it is 30% slower)
require("dotenv").config({ path: './private/settings.env' });
const mongoManager = require("./mongodb-manager.js");
const { body, validationResult } = require('express-validator');
const e = require("express");

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
        return res.status(400).redirect('/');
    }
    let cookieUsername;
    jwt.verify(req.cookies.auth, process.env.JWT_SECRET_KEY, (err, decodedCookie) => {
        if(err) {
            return res.status(400).redirect('/');
        }
        cookieUsername = decodedCookie.username;
    });

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
        return res.status(400).redirect('/');
    }
    let cookieUsername;
    jwt.verify(req.cookies.auth, process.env.JWT_SECRET_KEY, (err, decodedCookie) => {
        if(err) {
            return res.status(400).redirect('/');
        }
        cookieUsername = decodedCookie.username;
    });

    if(cookieUsername === req.params.username) { // is === the best here? maybe tolowercases?
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
        return res.status(400).redirect('/');
    }
    let cookieUsername;
    jwt.verify(req.cookies.auth, process.env.JWT_SECRET_KEY, (err, decodedCookie) => {
        if(err) {
            return res.status(400).redirect('/');
        }
        cookieUsername = decodedCookie.username;
    });

    if(cookieUsername === req.params.username) { // is === the best here?
        return res.status(400).send("One cannot follow themselves");
    }

    const mongo = mongoManager.getDB();

    // check if "is not even following"
        // as of now: if not following, no errors in mongo or node-app (which is nice)
    
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

router.get("/feed", async (req, res) => { // Elenco dei messaggi degli utenti seguiti
    const auth_cookie = req.cookies.auth;                   // interpreted as: "req.cookies.auth stops following `:username`"
    if(!auth_cookie) {
        return res.json( {authenticated : false} );
    }
    let cookieUsername;
    jwt.verify(req.cookies.auth, process.env.JWT_SECRET_KEY, (err, decodedCookie) => {
        if(err) {
            return res.json( {authenticated : false} );
        }
        cookieUsername = decodedCookie.username;
    });
    
    const mongo = mongoManager.getDB();

    const queryFollowedUsers = {
        username : cookieUsername
    }
    const queryFollowedUsersOptions = {
        projection : {
            _id : 0,
            followedUsers : 1
        }
    }
    
    let followedUsers = await mongo.collection("follows").findOne(queryFollowedUsers, queryFollowedUsersOptions);
    let feed = [];
    for(let user of followedUsers.followedUsers) {
        const queryMessages = {
            username : user
        }
        const queryMessagesOptions = {
            projection : {
                _id : 0,
                messageID : 1,
                message : 1,
                username : 1,
                date : 1,
                likedBy : 1
            }
        }
        let messagesOfUser = await mongo.collection("messages").find(queryMessages, queryMessagesOptions).toArray();

        for(let messageObject of messagesOfUser) {
            feed.push(messageObject);
        }
    }
    feed.sort( (msg1, msg2) => { // cookie preferences : sorting order
        if(msg1.date > msg2.date) {
            return -1;
        } else if(msg1.date < msg2.date) {
            return 1;
        } else {
            return 0;
        }
    });
    res.json(feed);
});

// -=-=-=-=-=-=-=-=-=-=-=-=-= so far _^_ it's all working -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


router.post("/like/:idMessage", async (req, res) => { // Like ad un messaggio con ID idMessage
    res.send("");
});

router.delete("/like/:idMessage", async (req, res) => { // Rimozione like al messaggio con ID idMessage
    res.send("");
});

router.get("/search", async (req, res) => { // Cerca l’utente che matcha la stringa query /search?q=[partial_username]
    if(req.query.q === undefined) {
        return res.json({});
    }
    if(req.query.q.length === 0) {
        return res.json({});
    }
    const mongo = mongoManager.getDB();
    //await mongo.collection("users").createIndex({ username: "text" });
    const queryOptions = {
        projection : {
            _id : 0,
            username : 1,
            firstName : 1,
            lastName : 1,
            bio : 1,
            signUpDate : 1
        }
    }
    //let correspondingUsers = await mongo.collection("users").find({$text: { $search: req.query.q }}, queryOptions).toArray();
    // maybe with a regex it would work /\
    let correspondingUsers = [];
    await mongo.collection("users").find({}, queryOptions).forEach(u => {
        if(u.username.includes(req.query.q)) {
            correspondingUsers.push(u);
        }
    });
    // for each of them, find number of followers and number of following?
    return res.json(correspondingUsers);
});

router.get("/whoami", async (req, res) => { // Se autenticato, restituisce le informazioni sull’utente
    const auth_cookie = req.cookies.auth;
    if(!auth_cookie) {
        return res.json( {authenticated : false} );
    }
    let cookieUsername;
    jwt.verify(req.cookies.auth, process.env.JWT_SECRET_KEY, (err, decodedCookie) => {
        if(err) {
            // cookie cannot be verified
            return res.json({ authenticated : false });              
        }
        cookieUsername = decodedCookie.username;
    });
    
    const mongo = mongoManager.getDB();
    const queryOptionsUser = {
        projection : {
            _id : 0,
            username : 1,
            firstName : 1,
            lastName : 1,
            bio : 1,
            signUpDate: 1
        }
    }
    const queryOptionsFollows = {
        projection : {
            _id : 0,
            username : 1,
            followedUsers : 1,
            followers : 1
        }
    }
    let userInfo = await mongo.collection("users").findOne({username : cookieUsername}, queryOptionsUser);
    let userFollows = await mongo.collection("follows").findOne({username : cookieUsername}, queryOptionsFollows);
    userInfo.authenticated = true;
    userInfo.followedUsers = userFollows.followedUsers;
    userInfo.followers = userFollows.followers;
    return res.json(userInfo);
});

module.exports = router;