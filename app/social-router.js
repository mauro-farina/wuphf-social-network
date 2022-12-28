const express = require("express");
const router = express.Router();
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

router.get("/users/:id", async (req, res) => { // Visualizzazione informazione dell’utente con ID id
    const mongo = mongoManager.getDB();
    let userByID = await mongo.collection("users").findOne({userID : parseInt(req.params.id)});
    if(userByID) {
        res.json(userByID);
    } else {
        res.send("user does not exist");
    }
});

router.get("/messages/:userId", (req, res) => { // Elenco dei messaggi dell’utente con ID userID
    res.send("");
});

router.get("/messages/:userId/:idMsg", (req, res) => { // Singolo messaggio dell’utente userID con ID idMsg
    res.send("");
});

router.post("/messages", (req, res) => { // Creazione di un nuovo messaggio
    res.send("");
});

router.get("/followers/:id", (req, res) => { // Lista dei followers dell’utente con ID id
    res.send("");
});

router.post("/followers/:id", (req, res) => { // Aggiunta di un nuovo follow per l’utente id
    res.send("");
});

router.delete("/followers/:id", (req, res) => { // Rimozione del follow all’utente id
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