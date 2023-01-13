const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // https://www.npmjs.com/package/bcryptjs
// written in pure JS => no compilation problems using docker (but it is 30% slower)
require("dotenv").config({ path: './private/settings.env' });
const mongoManager = require("../mongodb-manager.js");
const { body, param, query, cookie, validationResult } = require('express-validator');
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

const sanitizeParamUsername = [
    param('username').trim().escape()
];

const sanitizeParamMessageID = [
    param('messageID').trim().escape()
];

const sanitizeBodyMessage = [
    body('message')
        .trim()
        .notEmpty().withMessage("Cannot post empty messages")
        .escape()
];

const sanitizeQueryQ = [
    query('q').trim().escape()
];

router.get("/users/:username", sanitizeParamUsername, async (req, res) => { // Show informations about `:username`
    const mongo = mongoManager.getDB();
    const queryOptions = {
        projection : {
            _id : 0,
            username : 1,
            firstName : 1,
            lastName : 1,
            signUpDate : 1,
            bio : 1
        }
    };
    let getUserByUsername = await mongo.collection("users").findOne({username : req.params.username}, queryOptions);
    if(getUserByUsername) {
        res.json({
            found : true,
            user : getUserByUsername
        });
    } else {
        res.json({found : false});
    }
});


router.get("/messages", sanitizeQueryQ, async (req, res) => { // Get q (query parameter) random messages
    if(req.query.q === undefined) {
        return res.json({});
    }
    if(req.query.q.length === 0) {
        return res.json({});
    }
    if(req.query.q !== 'random') {
        return res.json({});
    }
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
    let lastMessage = await mongo.collection("messages").findOne({}, queryOptions);
    if(!lastMessage) {
        return res.json({}); // DB is empty!
    }
    const numberOfMsgs = lastMessage.messageID + 1;
    let numRandoms = numberOfMsgs < 20 ? Math.floor(numberOfMsgs/2) : 10;
    const randomMessages = [];
    for(let i=0; i<numRandoms; i++) {
        let rnd = Math.floor(Math.random() * numberOfMsgs);
        let randomMsg = await mongo.collection("messages").findOne({messageID : rnd}, {projection : queryOptions.projection});
        if(randomMessages.includes(randomMsg)) { i--; }
        else { randomMessages.push(randomMsg); }
    }
    return res.json(randomMessages);
});


router.get("/messages/:username", sanitizeParamUsername, async (req, res) => { // List messages wrote by `:username`
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
    if(messagesOfUser) {
        res.json(messagesOfUser);
    } else {
        res.json({});
    }
});


router.get("/messages/:username/:messageID", sanitizeParamUsername, sanitizeParamMessageID, async (req, res) => { // Single message `:messageID` wrote by `:username`
    const mongo = mongoManager.getDB();
    if(!await mongo.collection("users").findOne({username : req.params.username})) {
        return res.status(400).json({error : `user ${req.params.username} does not exist`});
    }
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
        res.json({});
    }
});


router.post("/messages", validateAuthCookie, sanitizeBodyMessage, async (req, res) => { // New message wrote by req.username
    const sanitizeInputErrors = validationResult(req);
	if (!sanitizeInputErrors.isEmpty()) {
        return res.status(400).json({ error : sanitizeInputErrors.array()[0].msg });
	}
    const cookieUsername = req.username;
    const mongo = mongoManager.getDB();
    let lastMessage = await mongo.collection("messages").findOne({},{ sort: {messageID: -1}});
    let msgID = lastMessage !== null ? lastMessage.messageID+1 : 0;
    let newMessage = {
        messageID : msgID,
        message : req.body.message,
        username : cookieUsername,
        date : new Date(),
        likedBy : []
    }

    await mongo.collection("messages").insertOne(newMessage);
    delete newMessage._id;
    res.json(newMessage);
});


router.get("/following/:username", sanitizeParamUsername, async (req, res) => { // Users followed by `:username`
    const mongo = mongoManager.getDB();
    if(!await mongo.collection("users").findOne({username : req.params.username})) {
        return res.status(400).json({error : `user ${req.params.username} does not exist`});
    }
    const queryOptions = {
        projection : {
            _id : 0,
            username : 1,
            followedUsers : 1
        }
    }
    let followedUsers = await mongo.collection("follows").findOne({username : req.params.username}, queryOptions);
    if(followedUsers){
        res.json(followedUsers);
    } else {
        res.json({});
    }
});


router.get("/followers/:username", sanitizeParamUsername, async (req, res) => { // Followers of `:username`
    const mongo = mongoManager.getDB();
    if(!await mongo.collection("users").findOne({username : req.params.username})) {
        return res.status(400).json({error : `user ${req.params.username} does not exist`});
    }
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
        res.json({});
    }
});


router.post("/followers/:username", validateAuthCookie, sanitizeParamUsername, async (req, res) => {   // req.username starts following `:username`
    const cookieUsername = req.username;
    if(cookieUsername.toLowerCase() === req.params.username.toLowerCase()) {
        return res.status(400).json({error : "One cannot follow themselves"});
    }

    const mongo = mongoManager.getDB();

    let getFollowersOfParamsUser = await mongo.collection("follows").findOne({username : req.params.username});
    if(getFollowersOfParamsUser === null) {
        return res.status(400).json({error : `user '${req.params.username}' does not exist`});
    }
    if(getFollowersOfParamsUser.followers.includes(cookieUsername)) {
        return res.status(400).json({error : `${cookieUsername} is already following ${req.params.username}`})
    }
    
    // `:username` has a new follower: cookieUsername
    await mongo.collection("follows").updateOne( {username : req.params.username}, { $push: {followers: cookieUsername} } );

    // cookieUsername now follows :username
    await mongo.collection("follows").updateOne( {username : cookieUsername}, { $push: {followedUsers: req.params.username} } );
    
    res.status(200).json({
        username : req.params.username,
        newFollower : cookieUsername
    });
});


router.delete("/followers/:username", validateAuthCookie, sanitizeParamUsername, async (req, res) => { // req.username stops following `:username`
    const cookieUsername = req.username;
    if(cookieUsername.toLowerCase() === req.params.username.toLowerCase()) {
        return res.status(400).json({error : "One cannot unfollow themself"});
    }

    const mongo = mongoManager.getDB();

    let getFollowersOfParamsUser = await mongo.collection("follows").findOne({username : req.params.username});
    if(getFollowersOfParamsUser === null) {
        return res.status(400).json({error : `user '${req.params.username}' does not exist`});
    }
    if(!getFollowersOfParamsUser.followers.includes(cookieUsername)) {
        return res.status(400).json({error : `${cookieUsername} is already not following ${req.params.username}`})
    }
    // `:username` loses a follower: cookieUsername
    await mongo.collection("follows").updateOne( {username : req.params.username}, { $pull: {followers: cookieUsername} } );
    // cookieUsername stops following :username
    await mongo.collection("follows").updateOne( {username : cookieUsername}, { $pull: {followedUsers: req.params.username} } );
    
    res.status(200).json({
        username : req.params.username,
        newFollower : cookieUsername
    });
});


router.get("/feed", validateAuthCookie, async (req, res) => { // List of messages (newst-to-oldest) sent users followed by req.username
    const cookieUsername = req.username;
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
    followedUsers.followedUsers.push(cookieUsername);
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


router.post("/like/:messageID", validateAuthCookie, sanitizeParamMessageID, async (req, res) => { // req.username likes message `:messageID`
    const cookieUsername = req.username;
    const mongo = mongoManager.getDB();

    let message = await mongo.collection("messages").findOne({messageID : parseInt(req.params.messageID)})
    if(!message) {
        return res.status(400).json({error : `There is no message with ID ${req.params.messageID}`});
    }
    if(message.likedBy.includes(cookieUsername)) {
        return res.status(400).json({error : `${cookieUsername} already likes message ${req.params.messageID}`});
    }

    let pushUsername = await mongo.collection("messages").updateOne( {messageID : parseInt(req.params.messageID)}, {$push: {likedBy: cookieUsername}} );
    if(pushUsername.modifiedCount === 1) {
        res.json({
            "messageID" : req.params.messageID,
            "nowLikedBy" : cookieUsername
        });
    } else {
        res.status(500).json({error : `something went wrong`});
    }
});


router.delete("/like/:messageID", validateAuthCookie, sanitizeParamMessageID, async (req, res) => { // req.username remove like to message `:messageID`
    const cookieUsername = req.username;
    const mongo = mongoManager.getDB();

    let message = await mongo.collection("messages").findOne({messageID : parseInt(req.params.messageID)})
    if(!message) {
        return res.status(400).json({error : `There is no message with ID ${req.params.messageID}`});
    }
    if(!message.likedBy.includes(cookieUsername)) {
        return res.status(400).json({error : `${cookieUsername} already did not like message ${req.params.messageID}`});
    }

    let pullUsername = await mongo.collection("messages").updateOne( {messageID : parseInt(req.params.messageID)}, {$pull: {likedBy: cookieUsername}} );
    if(pullUsername.modifiedCount === 1) {
        res.json({
            "messageID" : req.params.messageID,
            "notLikedAnymoreBy" : cookieUsername
        });
    } else {
        res.status(500).json({error : `something went wrong`});
    } 
});


router.get("/search", sanitizeQueryQ, async (req, res) => { // Search a user based on a partial username => /search?q=[partial_username]
    if(req.query.q === undefined) {
        return res.json({});
    }
    if(req.query.q.length === 0) {
        return res.json({});
    }
    const mongo = mongoManager.getDB();
    const queryOptions = {
        projection : {
            _id : 0,
            username : 1,
            firstName : 1,
            lastName : 1
        }
    }
    let correspondingUsers = [];
    await mongo.collection("users").find({}, queryOptions).forEach(u => {
        if(u.username.toLowerCase().includes(req.query.q.toLowerCase())
                || u.firstName.toLowerCase().includes(req.query.q.toLowerCase()) 
                || u.lastName.toLowerCase().includes(req.query.q.toLowerCase())) {
            correspondingUsers.push(u);
        }
    });
    return res.json(correspondingUsers);
});


router.get("/whoami", validateAuthCookie, async (req, res) => { // If authenticated, returns information about req.username
    const cookieUsername = req.username;
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
    const queryOptionsLikes = {
        projection : {
            _id : 0,
            messageID : 1
        }
    }

    let userInfo = await mongo.collection("users").findOne({username : cookieUsername}, queryOptionsUser);
    let userFollows = await mongo.collection("follows").findOne({username : cookieUsername}, queryOptionsFollows);
    userInfo.followedUsers = userFollows.followedUsers;
    userInfo.followers = userFollows.followers;
    userInfo.likedMessages = [];
    await mongo.collection("messages").find({likedBy : cookieUsername}, queryOptionsLikes).forEach(msg => {
        userInfo.likedMessages.push(msg.messageID);
    });
    userInfo.authenticated = true;
    return res.json(userInfo);
});


function validateAuthCookie(req, res, next) {
    cookie('auth').escape();
    const auth_cookie = req.cookies.auth;
    if(!auth_cookie) {
        return res.status(400).json({authenticated : false, reason : "No cookie"});
    }
    jwt.verify(auth_cookie, process.env.JWT_SECRET_KEY, (err, decodedCookie) => {
        if(err) {
            return res.status(400).json({authenticated : false, reason : "Cookie is invalid"});
        }
        req.username = decodedCookie.username;
        next();
    });
}


module.exports = router;