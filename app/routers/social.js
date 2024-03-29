const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // https://www.npmjs.com/package/bcryptjs
// written in pure JS => no compilation problems using docker (but it is 30% slower)
require("dotenv").config({ path: './private/settings.env' });
const mongoManager = require("../mongodb-manager.js");
const { body, param, query, cookie, validationResult } = require('express-validator');

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
    const usernameRegex = new RegExp(["^", req.params.username, "$"].join(""), "i");
    try {
        let getUserByUsername = await mongo.collection("users").findOne({username : usernameRegex}, queryOptions);
        if(getUserByUsername) {
            res.json({
                found : true,
                user : getUserByUsername
            });
        } else {
            res.json({found : false});
        }
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
});


router.get("/messages", sanitizeQueryQ, async (req, res) => { // Get some random messages if ?q=random
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
    try {
        let lastMessage = await mongo.collection("messages").findOne({}, queryOptions);
        if(!lastMessage) {
            return res.json({}); // DB is empty!
        }
        const numberOfMsgs = lastMessage.messageID + 1;
        let numRandoms = numberOfMsgs < 20 ? Math.max(1,Math.floor(numberOfMsgs/3)) : 10;
        const randomMessages = [];
        let controlBool = false;
        for(let i=0; i<numRandoms; i++) {
            let rnd = Math.floor(Math.random() * numberOfMsgs);
            let randomMsg = await mongo.collection("messages").findOne({messageID : rnd}, {projection : queryOptions.projection});
            randomMessages.forEach(m => {
                if(m.messageID === randomMsg.messageID) {
                    controlBool = true;
                }
            })
            if(controlBool) { i--; controlBool = false; continue; }
            else { randomMessages.push(randomMsg); }
        }
        return res.json(randomMessages);
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
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
    const usernameRegex = new RegExp(["^", req.params.username, "$"].join(""), "i");
    try {
        let messagesOfUser = await mongo.collection("messages").find({username : usernameRegex}, queryOptions).toArray();
        if(messagesOfUser) {
            res.json(messagesOfUser);
        } else {
            res.json({});
        }
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
});


router.get("/messages/:username/:messageID", sanitizeParamUsername, sanitizeParamMessageID, async (req, res) => { // Single message `:messageID` wrote by `:username`
    const mongo = mongoManager.getDB();
    const usernameRegex = new RegExp(["^", req.params.username, "$"].join(""), "i");
    try {
        if(!await mongo.collection("users").findOne({username : usernameRegex})) {
            return res.status(400).json({error : `user ${req.params.username} does not exist`});
        }
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
    const query = {
        username : usernameRegex, 
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
    try {
        let messagesOfUser = await mongo.collection("messages").findOne(query, queryOptions);
        if(messagesOfUser) {
            res.json(messagesOfUser);
        } else {
            res.status(400).json({error : `Could not find message ${req.params.messageID} by ${req.params.username}`});
        }
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
});


router.post("/messages", validateAuthCookie, sanitizeBodyMessage, async (req, res) => { // New message wrote by req.username
    const sanitizeInputErrors = validationResult(req);
	if (!sanitizeInputErrors.isEmpty()) {
        return res.status(400).json({ error : sanitizeInputErrors.array()[0].msg });
	}
    const cookieUsername = req.username;
    const mongo = mongoManager.getDB();
    try {
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
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
});


router.get("/following/:username", sanitizeParamUsername, async (req, res) => { // Users followed by `:username`
    const mongo = mongoManager.getDB();
    const usernameRegex = new RegExp(["^", req.params.username, "$"].join(""), "i");
    try {
        if(!await mongo.collection("users").findOne({username : usernameRegex})) {
            return res.status(400).json({error : `user ${req.params.username} does not exist`});
        }
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
    const queryOptions = {
        projection : {
            _id : 0,
            username : 1
        }
    }
    try {
        let followedUsers = await mongo.collection("follows").find({followers : usernameRegex}, queryOptions).toArray();
        if(followedUsers){
            res.json({
                username : req.params.username,
                followedUsers : followedUsers
            });
        } else {
            console.error(`Something went wrong: ${err}`);
            return res.status(500).json({error : "Server error"});
        }
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
});


router.get("/followers/:username", sanitizeParamUsername, async (req, res) => { // Followers of `:username`
    const mongo = mongoManager.getDB();
    const usernameRegex = new RegExp(["^", req.params.username, "$"].join(""), "i");
    try {
        if(!await mongo.collection("users").findOne({username : usernameRegex})) {
            return res.status(400).json({error : `user ${req.params.username} does not exist`});
        }
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
    const queryOptions = {
        projection : {
            _id : 0,
            username : 1,
            followers : 1
        }
    }
    try {
        let followersOfUser = await mongo.collection("follows").findOne({username : usernameRegex}, queryOptions);
        if(followersOfUser){
            res.json(followersOfUser);
        } else {
            res.json({});
        }
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
});


router.post("/followers/:username", validateAuthCookie, sanitizeParamUsername, async (req, res) => {   // req.username starts following `:username`
    const cookieUsername = req.username;
    const usernameRegex = new RegExp(["^", req.params.username, "$"].join(""), "i");
    if(cookieUsername.toLowerCase() === req.params.username.toLowerCase()) {
        return res.status(400).json({error : "One cannot follow themselves"});
    }

    const mongo = mongoManager.getDB();
    try {
        let getFollowersOfParamsUser = await mongo.collection("follows").findOne({username : usernameRegex});
        if(getFollowersOfParamsUser === null) {
            return res.status(400).json({error : `user '${req.params.username}' does not exist`});
        }
        if(getFollowersOfParamsUser.followers.includes(cookieUsername)) {
            return res.status(400).json({error : `${cookieUsername} is already following ${req.params.username}`})
        }
        
        // `:username` has a new follower: cookieUsername
        await mongo.collection("follows").updateOne( {username : usernameRegex}, { $push: {followers: cookieUsername} } );
        
        res.status(200).json({
            username : req.params.username,
            newFollower : cookieUsername
        });
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
});


router.delete("/followers/:username", validateAuthCookie, sanitizeParamUsername, async (req, res) => { // req.username stops following `:username`
    const cookieUsername = req.username;
    if(cookieUsername.toLowerCase() === req.params.username.toLowerCase()) {
        return res.status(400).json({error : "One cannot unfollow themself"});
    }
    const usernameRegex = new RegExp(["^", req.params.username, "$"].join(""), "i");
    const mongo = mongoManager.getDB();
    try {
        let getFollowersOfParamsUser = await mongo.collection("follows").findOne({username : usernameRegex});
        if(getFollowersOfParamsUser === null) {
            return res.status(400).json({error : `user '${req.params.username}' does not exist`});
        }
        if(!getFollowersOfParamsUser.followers.includes(cookieUsername)) {
            return res.status(400).json({error : `${cookieUsername} is already not following ${req.params.username}`})
        }
        // `:username` loses a follower: cookieUsername
        await mongo.collection("follows").updateOne( {username : usernameRegex}, { $pull: {followers: cookieUsername} } );
        
        res.status(200).json({
            username : req.params.username,
            newFollower : cookieUsername
        });
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
});


router.get("/feed", validateAuthCookie, async (req, res) => { // List of messages (newst-to-oldest) sent users followed by req.username
    const cookieUsername = req.username;
    const mongo = mongoManager.getDB();
    const queryFollowedUsersOptions = {
        projection : {
            _id : 0,
            username : 1
        }
    }
    try {
        let followedUsers = await mongo.collection("follows").find({followers : cookieUsername}, queryFollowedUsersOptions).toArray();
        followedUsers.push({ username : cookieUsername});
        let feed = [];
        for(let user of followedUsers) {
            const followedUser = new RegExp(["^", user.username, "$"].join(""), "i");
            const queryMessages = {
                username : followedUser
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
        feed.sort( (msg1, msg2) => {
            if(msg1.date > msg2.date) {
                return -1;
            } else if(msg1.date < msg2.date) {
                return 1;
            } else {
                return 0;
            }
        });
        res.json(feed);
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
});


router.post("/like/:messageID", validateAuthCookie, sanitizeParamMessageID, async (req, res) => { // req.username likes message `:messageID`
    const cookieUsername = req.username;
    const mongo = mongoManager.getDB();

    try {
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
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
    
});


router.delete("/like/:messageID", validateAuthCookie, sanitizeParamMessageID, async (req, res) => { // req.username remove like to message `:messageID`
    const cookieUsername = req.username;
    const mongo = mongoManager.getDB();
    try {
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
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
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
            lastName : 1,
            bio : 1
        }
    }
    let correspondingUsers = [];
    try {
        await mongo.collection("users").find({}, queryOptions).forEach(u => {
            if(u.username.toLowerCase().includes(req.query.q.toLowerCase())
                    || u.firstName.toLowerCase().includes(req.query.q.toLowerCase()) 
                    || u.lastName.toLowerCase().includes(req.query.q.toLowerCase())) {
                correspondingUsers.push(u);
            }
        });
        return res.json(correspondingUsers);
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
});


router.get("/whoami", validateAuthCookie, async (req, res) => { // If authenticated, returns information about req.username
    const cookieUsername = req.username;
    const mongo = mongoManager.getDB();
    const queryOptions = {
        projection : {
            _id : 0,
            username : 1,
            firstName : 1,
            lastName : 1,
            bio : 1,
            signUpDate: 1
        }
    }
    try {
        let userInfo = await mongo.collection("users").findOne({username : cookieUsername}, queryOptions);
        userInfo.authenticated = true;
        return res.json(userInfo);
    } catch(err) {
        console.error(`Something went wrong: ${err}`);
        return res.status(500).json({error : "Server error"});
    }
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