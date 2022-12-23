const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: './private/settings.env' });
const mongoManager = require("./mongodb-manager.js");

/*
POST    /api/auth/signup    Registrazione di un nuovo utente
POST    /api/auth/signin    Login di un utente
*/

router.get("/signup", async (req, res) => {
    const mongo = mongoManager.getDB();
    const credentials = req.body; //express.json() should parse from String to JSON if content-type = app/json
    let dbResults = await mongo.collection("users").findOne({'username': req.body.username});
    const token = jwt.sign({ id: 7, name: "test-jwt-cookie" }, process.env.JWT_SECRET_KEY, (err,token) => {
        res.cookie("access_token", token, {httpOnly: true,}).status(200).json({token,});
        /** MESSAGGIO DI FIREFOX
         * Il cookie “access_token” non presenta un valore valido per l’attributo “SameSite”. 
         * Presto i cookie senza l’attributo “SameSite” o con un valore non valido verranno gestiti come “Lax”. 
         * Questo significa che il cookie non verrà più inviato in contesti di terze parti. 
         * Se l’applicazione dipende dalla disponibilità di questo cookie in questo tipo di contesto, 
         * aggiungere l’attributo “SameSite=None“.
         */
    });
});

router.get("/signin", (req, res) => {
    res.send(jwt.verify(req.cookies.access_token, "YOUR_SECRET_KEY"));
});

module.exports = router;